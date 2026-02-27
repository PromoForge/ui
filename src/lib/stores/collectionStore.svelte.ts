import {
  listCollections,
  createCollection as createCollectionApi,
  updateCollection as updateCollectionApi,
  deleteCollection as deleteCollectionApi,
  importCollectionItems as importCollectionItemsApi,
  exportCollectionItems as exportCollectionItemsApi,
} from "$lib/services/collectionService";
import type {
  Collection,
  CreateAccountCollectionRequest,
  UpdateAccountCollectionRequest,
} from "$lib/api/generated/types.gen";

function createCollectionStore() {
  let collections = $state<Collection[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingCollection = $state<Collection | null>(null);

  const filteredCollections = $derived.by(() => {
    let result = collections;

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

  const totalFiltered = $derived(filteredCollections.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCollections = $derived(
    filteredCollections.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadCollections() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listCollections();
      collections = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load collections";
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

  async function addCollection(
    request: CreateAccountCollectionRequest,
  ): Promise<Collection> {
    const collection = await createCollectionApi(request);
    collections = [collection, ...collections];
    return collection;
  }

  function openEditSheet(collection: Collection) {
    editingCollection = collection;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingCollection = null;
  }

  async function modifyCollection(
    id: number,
    request: Omit<UpdateAccountCollectionRequest, "collectionId">,
  ): Promise<void> {
    const updated = await updateCollectionApi(id, request);
    collections = collections.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function removeCollection(id: number): Promise<void> {
    await deleteCollectionApi(id);
    collections = collections.filter((c) => c.id !== id);
  }

  async function importItems(
    collectionId: number,
    csvData: string,
  ): Promise<void> {
    const updated = await importCollectionItemsApi(collectionId, csvData);
    collections = collections.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function exportItems(collectionId: number): Promise<string> {
    return await exportCollectionItemsApi(collectionId);
  }

  return {
    get collections() {
      return collections;
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
    get editingCollection() {
      return editingCollection;
    },
    get filteredCollections() {
      return filteredCollections;
    },
    get paginatedCollections() {
      return paginatedCollections;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },
    loadCollections,
    setSearchQuery,
    setPage,
    addCollection,
    openEditSheet,
    closeEditSheet,
    modifyCollection,
    removeCollection,
    importItems,
    exportItems,
  };
}

export const collectionStore = createCollectionStore();
