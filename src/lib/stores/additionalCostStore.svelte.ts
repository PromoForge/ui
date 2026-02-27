import {
  listAdditionalCosts,
  createAdditionalCost as createAdditionalCostApi,
  updateAdditionalCost as updateAdditionalCostApi,
  deleteAdditionalCost as deleteAdditionalCostApi,
} from "$lib/services/additionalCostService";
import type {
  AdditionalCost,
  CreateAdditionalCostRequest,
  UpdateAdditionalCostRequest,
} from "$lib/api/generated/types.gen";

export const SCOPE_LABELS: Record<string, string> = {
  ADDITIONAL_COST_TYPE_SESSION: "Cart (Session)",
  ADDITIONAL_COST_TYPE_ITEM: "Item",
  ADDITIONAL_COST_TYPE_BOTH: "Cart (Session) & Item",
};

function createAdditionalCostStore() {
  let additionalCosts = $state<AdditionalCost[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingCost = $state<AdditionalCost | null>(null);

  const filteredCosts = $derived.by(() => {
    let result = additionalCosts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.title ?? "").toLowerCase().includes(q) ||
          (c.name ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  });

  const totalFiltered = $derived(filteredCosts.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCosts = $derived(
    filteredCosts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  );

  async function loadAdditionalCosts() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listAdditionalCosts();
      additionalCosts = result.data;
    } catch (e) {
      error =
        e instanceof Error ? e.message : "Failed to load additional costs";
    } finally {
      loading = false;
    }
  }

  function setSearchQuery(query: string) {
    searchQuery = query;
    currentPage = 1;
  }

  function setPage(p: number) {
    currentPage = Math.max(1, Math.min(p, totalPages));
  }

  async function createCost(
    request: CreateAdditionalCostRequest,
  ): Promise<AdditionalCost> {
    const cost = await createAdditionalCostApi(request);
    additionalCosts = [cost, ...additionalCosts];
    return cost;
  }

  function openEditSheet(cost: AdditionalCost) {
    editingCost = cost;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingCost = null;
  }

  async function updateCost(
    id: number,
    request: Omit<UpdateAdditionalCostRequest, "additionalCostId">,
  ): Promise<void> {
    const updated = await updateAdditionalCostApi(id, request);
    additionalCosts = additionalCosts.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function removeCost(id: number): Promise<void> {
    await deleteAdditionalCostApi(id);
    additionalCosts = additionalCosts.filter((c) => c.id !== id);
  }

  return {
    get additionalCosts() {
      return additionalCosts;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get searchQuery() {
      return searchQuery;
    },
    get currentPage() {
      return currentPage;
    },
    get pageSize() {
      return pageSize;
    },
    get createSheetOpen() {
      return createSheetOpen;
    },
    set createSheetOpen(v: boolean) {
      createSheetOpen = v;
    },
    get editSheetOpen() {
      return editSheetOpen;
    },
    set editSheetOpen(v: boolean) {
      editSheetOpen = v;
    },
    get editingCost() {
      return editingCost;
    },
    get filteredCosts() {
      return filteredCosts;
    },
    get paginatedCosts() {
      return paginatedCosts;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },
    loadAdditionalCosts,
    setSearchQuery,
    setPage,
    createCost,
    openEditSheet,
    closeEditSheet,
    updateCost,
    removeCost,
  };
}

export const additionalCostStore = createAdditionalCostStore();
