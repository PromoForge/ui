import {
  listCustomEffects,
  createCustomEffect as createCustomEffectApi,
  updateCustomEffect as updateCustomEffectApi,
  deleteCustomEffect as deleteCustomEffectApi,
  getCustomEffect as getCustomEffectApi,
} from "$lib/services/customEffectService";
import type {
  CustomEffect,
  CreateCustomEffectRequest,
  UpdateCustomEffectRequest,
} from "$lib/api/generated/types.gen";

function createCustomEffectStore() {
  let customEffects = $state<CustomEffect[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);

  const filteredCustomEffects = $derived.by(() => {
    let result = customEffects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ce) =>
          (ce.apiName ?? "").toLowerCase().includes(q) ||
          (ce.ruleBuilderName ?? "").toLowerCase().includes(q) ||
          (ce.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  });

  const totalFiltered = $derived(filteredCustomEffects.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCustomEffects = $derived(
    filteredCustomEffects.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadCustomEffects() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listCustomEffects();
      customEffects = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load custom effects";
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

  async function addCustomEffect(request: CreateCustomEffectRequest): Promise<CustomEffect> {
    const effect = await createCustomEffectApi(request);
    customEffects = [effect, ...customEffects];
    return effect;
  }

  async function modifyCustomEffect(
    id: number,
    request: Omit<UpdateCustomEffectRequest, "customEffectId">,
  ): Promise<CustomEffect> {
    const updated = await updateCustomEffectApi(id, request);
    customEffects = customEffects.map((ce) => (ce.id === updated.id ? updated : ce));
    return updated;
  }

  async function removeCustomEffect(id: number): Promise<void> {
    await deleteCustomEffectApi(id);
    customEffects = customEffects.filter((ce) => ce.id !== id);
  }

  async function fetchCustomEffect(id: number): Promise<CustomEffect> {
    return getCustomEffectApi(id);
  }

  return {
    get customEffects() { return customEffects; },
    get loading() { return loading; },
    get error() { return error; },
    get searchQuery() { return searchQuery; },
    get currentPage() { return currentPage; },
    get pageSize() { return pageSize; },
    get filteredCustomEffects() { return filteredCustomEffects; },
    get paginatedCustomEffects() { return paginatedCustomEffects; },
    get totalFiltered() { return totalFiltered; },
    get totalPages() { return totalPages; },

    loadCustomEffects,
    setSearchQuery,
    setPage,
    addCustomEffect,
    modifyCustomEffect,
    removeCustomEffect,
    fetchCustomEffect,
  };
}

export const customEffectStore = createCustomEffectStore();
