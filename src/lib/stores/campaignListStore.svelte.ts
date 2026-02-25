import {
  getCampaignList,
  cloneCampaign,
} from "$lib/services/campaignListService";
import type { CampaignListItem, CampaignListFilterStatus } from "$lib/types";

type Tab = "current" | "calendar" | "archived";

function createCampaignListStore() {
  let campaigns = $state<CampaignListItem[]>([]);
  let activeTab = $state<Tab>("current");
  let searchQuery = $state("");
  let activeFilters = $state<Set<CampaignListFilterStatus>>(new Set());
  let page = $state(1);
  const pageSize = 50;
  let loading = $state(false);

  // --- Derived chain: tab → search → status → paginate ---

  const tabFilteredCampaigns = $derived(
    activeTab === "archived"
      ? campaigns.filter((c) => c.archived)
      : campaigns.filter((c) => !c.archived),
  );

  const searchFilteredCampaigns = $derived(() => {
    if (!searchQuery.trim()) return tabFilteredCampaigns;
    const q = searchQuery.trim().toLowerCase();
    return tabFilteredCampaigns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  });

  const statusFilteredCampaigns = $derived(() => {
    const filtered = searchFilteredCampaigns();
    if (activeFilters.size === 0) return filtered;
    return filtered.filter((c) => {
      for (const f of activeFilters) {
        if (f === "lowOnBudget" && c.lowOnBudget) return true;
        if (f === "expiringSoon" && isExpiringSoon(c)) return true;
        if (f === c.status) return true;
      }
      return false;
    });
  });

  const totalCount = $derived(statusFilteredCampaigns().length);

  const paginatedCampaigns = $derived(() => {
    const start = (page - 1) * pageSize;
    return statusFilteredCampaigns().slice(start, start + pageSize);
  });

  // Filter counts are computed from tab-filtered data (not affected by active status filters)
  const filterCounts = $derived(() => {
    const base = searchFilteredCampaigns();
    const counts: Record<CampaignListFilterStatus, number> = {
      scheduled: 0,
      running: 0,
      expired: 0,
      disabled: 0,
      lowOnBudget: 0,
      expiringSoon: 0,
    };
    for (const c of base) {
      if (c.status === "scheduled") counts.scheduled++;
      if (c.status === "running") counts.running++;
      if (c.status === "expired") counts.expired++;
      if (c.status === "disabled") counts.disabled++;
      if (c.lowOnBudget) counts.lowOnBudget++;
      if (isExpiringSoon(c)) counts.expiringSoon++;
    }
    return counts;
  });

  const totalPages = $derived(Math.max(1, Math.ceil(totalCount / pageSize)));

  // --- Actions ---

  async function loadCampaigns(applicationId: string) {
    loading = true;
    try {
      campaigns = await getCampaignList(applicationId);
    } finally {
      loading = false;
    }
  }

  function setTab(tab: Tab) {
    activeTab = tab;
    searchQuery = "";
    activeFilters = new Set();
    page = 1;
  }

  function setSearchQuery(query: string) {
    searchQuery = query;
    page = 1;
  }

  function toggleFilter(status: CampaignListFilterStatus) {
    const next = new Set(activeFilters);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    activeFilters = next;
    page = 1;
  }

  function clearFilters() {
    activeFilters = new Set();
    page = 1;
  }

  function setPage(p: number) {
    page = p;
  }

  async function clone(campaignId: string, newName: string) {
    const cloned = await cloneCampaign(campaignId, newName);
    campaigns = [cloned, ...campaigns];
  }

  return {
    get campaigns() {
      return paginatedCampaigns();
    },
    get activeTab() {
      return activeTab;
    },
    get searchQuery() {
      return searchQuery;
    },
    get activeFilters() {
      return activeFilters;
    },
    get page() {
      return page;
    },
    get pageSize() {
      return pageSize;
    },
    get totalCount() {
      return totalCount;
    },
    get totalPages() {
      return totalPages;
    },
    get filterCounts() {
      return filterCounts();
    },
    get loading() {
      return loading;
    },
    loadCampaigns,
    setTab,
    setSearchQuery,
    toggleFilter,
    clearFilters,
    setPage,
    clone,
  };
}

// Helper: campaign expires within 7 days and is still running
function isExpiringSoon(c: CampaignListItem): boolean {
  if (c.status !== "running") return false;
  const endDate = new Date(c.endDate);
  const now = new Date();
  const daysUntilEnd =
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilEnd >= 0 && daysUntilEnd <= 7;
}

export const campaignListStore = createCampaignListStore();
