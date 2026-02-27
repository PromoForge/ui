import {
  listCatalogs,
  getCatalog as getCatalogApi,
  createCatalog as createCatalogApi,
  updateCatalog as updateCatalogApi,
  deleteCatalog as deleteCatalogApi,
  listCatalogItems,
} from "$lib/services/catalogService";
import type {
  Catalog,
  CatalogItem,
  CreateCatalogRequest,
  UpdateCatalogRequest,
} from "$lib/api/generated/types.gen";

function createCatalogStore() {
  // List page state
  let catalogs = $state<Catalog[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingCatalog = $state<Catalog | null>(null);

  // Detail page state
  let selectedCatalog = $state<Catalog | null>(null);
  let catalogItems = $state<CatalogItem[]>([]);
  let itemsLoading = $state(false);
  let itemsError = $state<string | null>(null);
  let itemsTotal = $state(0);
  let itemsPage = $state(1);
  let itemsPageSize = $state(50);
  let itemsSearchQuery = $state("");
  let itemsFilterField = $state("sku");

  // List page derived
  const filteredCatalogs = $derived.by(() => {
    let result = catalogs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  });

  const totalFiltered = $derived(filteredCatalogs.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCatalogs = $derived(
    filteredCatalogs.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  // Detail page derived — client-side filtering of loaded items
  const filteredItems = $derived.by(() => {
    if (!itemsSearchQuery.trim()) return catalogItems;
    const q = itemsSearchQuery.toLowerCase();
    return catalogItems.filter((item) => {
      if (itemsFilterField === "sku") {
        return (item.sku ?? "").toLowerCase().includes(q);
      }
      if (itemsFilterField === "product") {
        return (item.product?.name ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  });

  const itemsTotalPages = $derived(
    Math.max(1, Math.ceil(itemsTotal / itemsPageSize)),
  );

  // List page actions
  async function loadCatalogs() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listCatalogs();
      catalogs = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load catalogs";
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

  async function addCatalog(request: CreateCatalogRequest): Promise<Catalog> {
    const catalog = await createCatalogApi(request);
    catalogs = [catalog, ...catalogs];
    return catalog;
  }

  function openEditSheet(catalog: Catalog) {
    editingCatalog = catalog;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingCatalog = null;
  }

  async function modifyCatalog(
    id: number,
    request: Omit<UpdateCatalogRequest, "catalogId">,
  ): Promise<void> {
    const updated = await updateCatalogApi(id, request);
    catalogs = catalogs.map((c) => (c.id === updated.id ? updated : c));
    // Also update selectedCatalog if viewing detail page
    if (selectedCatalog?.id === updated.id) {
      selectedCatalog = updated;
    }
  }

  async function removeCatalog(id: number): Promise<void> {
    await deleteCatalogApi(id);
    catalogs = catalogs.filter((c) => c.id !== id);
  }

  // Detail page actions
  async function loadCatalog(catalogId: number) {
    itemsLoading = true;
    itemsError = null;
    try {
      selectedCatalog = await getCatalogApi(catalogId);
    } catch (e) {
      itemsError = e instanceof Error ? e.message : "Failed to load catalog";
    } finally {
      itemsLoading = false;
    }
  }

  async function loadItems(catalogId: number) {
    itemsLoading = true;
    itemsError = null;
    try {
      const skip = (itemsPage - 1) * itemsPageSize;
      const result = await listCatalogItems(catalogId, itemsPageSize, skip);
      catalogItems = result.data;
      itemsTotal = result.total;
    } catch (e) {
      itemsError =
        e instanceof Error ? e.message : "Failed to load catalog items";
    } finally {
      itemsLoading = false;
    }
  }

  function setItemsPage(p: number) {
    itemsPage = Math.max(1, Math.min(p, itemsTotalPages));
  }

  function setItemsSearchQuery(query: string) {
    itemsSearchQuery = query;
  }

  function setItemsFilterField(field: string) {
    itemsFilterField = field;
  }

  function resetDetailState() {
    selectedCatalog = null;
    catalogItems = [];
    itemsLoading = false;
    itemsError = null;
    itemsTotal = 0;
    itemsPage = 1;
    itemsSearchQuery = "";
    itemsFilterField = "sku";
  }

  return {
    // List page state
    get catalogs() {
      return catalogs;
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
    get editingCatalog() {
      return editingCatalog;
    },
    get filteredCatalogs() {
      return filteredCatalogs;
    },
    get paginatedCatalogs() {
      return paginatedCatalogs;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },

    // Detail page state
    get selectedCatalog() {
      return selectedCatalog;
    },
    get catalogItems() {
      return catalogItems;
    },
    get filteredItems() {
      return filteredItems;
    },
    get itemsLoading() {
      return itemsLoading;
    },
    get itemsError() {
      return itemsError;
    },
    get itemsTotal() {
      return itemsTotal;
    },
    get itemsPage() {
      return itemsPage;
    },
    get itemsPageSize() {
      return itemsPageSize;
    },
    get itemsSearchQuery() {
      return itemsSearchQuery;
    },
    get itemsFilterField() {
      return itemsFilterField;
    },
    get itemsTotalPages() {
      return itemsTotalPages;
    },

    // List page actions
    loadCatalogs,
    setSearchQuery,
    setPage,
    addCatalog,
    openEditSheet,
    closeEditSheet,
    modifyCatalog,
    removeCatalog,

    // Detail page actions
    loadCatalog,
    loadItems,
    setItemsPage,
    setItemsSearchQuery,
    setItemsFilterField,
    resetDetailState,
  };
}

export const catalogStore = createCatalogStore();
