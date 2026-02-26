import {
  listAttributes,
  createAttribute as createAttributeApi,
  updateAttribute as updateAttributeApi,
  deleteAttribute as deleteAttributeApi,
  importAttributeAllowedList as importAllowedListApi,
} from "$lib/services/attributeService";
import type {
  Attribute,
  CreateAttributeRequest,
  UpdateAttributeRequest,
} from "$lib/api/generated/types.gen";

export const ENTITY_LABELS: Record<string, string> = {
  ATTRIBUTE_ENTITY_APPLICATION: "Application",
  ATTRIBUTE_ENTITY_CAMPAIGN: "Campaign",
  ATTRIBUTE_ENTITY_CART_ITEM: "Item",
  ATTRIBUTE_ENTITY_COUPON: "Coupon",
  ATTRIBUTE_ENTITY_CUSTOMER_PROFILE: "Customer Profile",
  ATTRIBUTE_ENTITY_CUSTOMER_SESSION: "Current Session",
  ATTRIBUTE_ENTITY_EVENT: "Event",
  ATTRIBUTE_ENTITY_GIVEAWAY: "Giveaway",
  ATTRIBUTE_ENTITY_REFERRAL: "Referral",
  ATTRIBUTE_ENTITY_STORE: "Store",
};

export const TYPE_LABELS: Record<string, string> = {
  ATTRIBUTE_TYPE_STRING: "String",
  ATTRIBUTE_TYPE_NUMBER: "Number",
  ATTRIBUTE_TYPE_BOOLEAN: "Boolean",
  ATTRIBUTE_TYPE_TIME: "Time",
  ATTRIBUTE_TYPE_LOCATION: "Location",
  ATTRIBUTE_TYPE_LIST_OF_STRINGS: "List (Strings)",
  ATTRIBUTE_TYPE_LIST_OF_NUMBERS: "List (Numbers)",
};

export type SortMode = "most-used" | "name-asc" | "name-desc";

export type FilterState = {
  entity: Set<string>;
  type: Set<string>;
  visibility: Set<string>;
};

function createAttributeStore() {
  let attributes = $state<Attribute[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let activeTab = $state<"custom" | "builtin">("custom");
  let searchQuery = $state("");
  let filters = $state<FilterState>({
    entity: new Set(),
    type: new Set(),
    visibility: new Set(),
  });
  let sortBy = $state<SortMode>("most-used");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingAttribute = $state<Attribute | null>(null);

  const filteredAttributes = $derived.by(() => {
    let result = attributes;

    // Tab filter
    if (activeTab === "custom") {
      result = result.filter((a) => !a.isBuiltin);
    } else {
      result = result.filter((a) => a.isBuiltin);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          (a.title ?? "").toLowerCase().includes(q) ||
          (a.name ?? "").toLowerCase().includes(q),
      );
    }

    // Entity filter
    if (filters.entity.size > 0) {
      result = result.filter((a) => a.entity && filters.entity.has(a.entity));
    }

    // Type filter
    if (filters.type.size > 0) {
      result = result.filter((a) => a.type && filters.type.has(a.type));
    }

    // Visibility filter
    if (filters.visibility.size > 0) {
      result = result.filter((a) => {
        const vis = a.editable ? "visible" : "hidden";
        return filters.visibility.has(vis);
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.title ?? "").localeCompare(b.title ?? "");
        case "name-desc":
          return (b.title ?? "").localeCompare(a.title ?? "");
        case "most-used":
        default:
          return (b.id ?? 0) - (a.id ?? 0);
      }
    });

    return result;
  });

  const totalFiltered = $derived(filteredAttributes.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedAttributes = $derived(
    filteredAttributes.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );
  const activeFilterCount = $derived(
    filters.entity.size + filters.type.size + filters.visibility.size,
  );

  async function loadAttributes() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listAttributes();
      attributes = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load attributes";
    } finally {
      loading = false;
    }
  }

  function setActiveTab(tab: "custom" | "builtin") {
    activeTab = tab;
    currentPage = 1;
  }

  function setSearchQuery(query: string) {
    searchQuery = query;
    currentPage = 1;
  }

  function toggleFilter(category: keyof FilterState, value: string) {
    const set = new Set(filters[category]);
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    filters = { ...filters, [category]: set };
    currentPage = 1;
  }

  function clearFilters() {
    filters = { entity: new Set(), type: new Set(), visibility: new Set() };
    currentPage = 1;
  }

  function setSortBy(mode: SortMode) {
    sortBy = mode;
  }

  function setPage(p: number) {
    currentPage = Math.max(1, Math.min(p, totalPages));
  }

  async function createAttribute(
    request: CreateAttributeRequest,
    csvContent?: string,
  ): Promise<Attribute> {
    const attr = await createAttributeApi(request);
    attributes = [attr, ...attributes];
    if (csvContent && attr.id) {
      await importAllowedListApi(attr.id, csvContent);
    }
    return attr;
  }

  async function toggleVisibility(attr: Attribute): Promise<void> {
    if (!attr.id) return;
    const updated = await updateAttributeApi(attr.id, {
      editable: !attr.editable,
    });
    attributes = attributes.map((a) => (a.id === updated.id ? updated : a));
  }

  function openEditSheet(attribute: Attribute) {
    editingAttribute = attribute;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingAttribute = null;
  }

  async function updateAttributeData(
    id: number,
    request: Omit<UpdateAttributeRequest, "attributeId">,
    csvContent?: string,
  ): Promise<void> {
    const updated = await updateAttributeApi(id, request);
    attributes = attributes.map((a) => (a.id === updated.id ? updated : a));
    if (csvContent && id) {
      await importAllowedListApi(id, csvContent);
    }
  }

  async function removeAttribute(id: number): Promise<void> {
    await deleteAttributeApi(id);
    attributes = attributes.filter((a) => a.id !== id);
  }

  return {
    get attributes() {
      return attributes;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get activeTab() {
      return activeTab;
    },
    get searchQuery() {
      return searchQuery;
    },
    get filters() {
      return filters;
    },
    get sortBy() {
      return sortBy;
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
    get editingAttribute() {
      return editingAttribute;
    },
    get filteredAttributes() {
      return filteredAttributes;
    },
    get paginatedAttributes() {
      return paginatedAttributes;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },
    get activeFilterCount() {
      return activeFilterCount;
    },
    loadAttributes,
    setActiveTab,
    setSearchQuery,
    toggleFilter,
    clearFilters,
    setSortBy,
    setPage,
    createAttribute,
    toggleVisibility,
    openEditSheet,
    closeEditSheet,
    updateAttributeData,
    removeAttribute,
  };
}

export const attributeStore = createAttributeStore();
