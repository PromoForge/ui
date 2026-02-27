import {
  listWebhooks,
  createWebhook as createWebhookApi,
  updateWebhook as updateWebhookApi,
  deleteWebhook as deleteWebhookApi,
  testWebhook as testWebhookApi,
  copyWebhook as copyWebhookApi,
} from "$lib/services/webhookService";
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookResponse,
} from "$lib/api/generated/types.gen";

function createWebhookStore() {
  let webhooks = $state<Webhook[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingWebhook = $state<Webhook | null>(null);

  const filteredWebhooks = $derived.by(() => {
    let result = webhooks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          (w.name ?? "").toLowerCase().includes(q) ||
          (w.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  });

  const totalFiltered = $derived(filteredWebhooks.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedWebhooks = $derived(
    filteredWebhooks.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadWebhooks() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listWebhooks();
      webhooks = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load webhooks";
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

  async function addWebhook(request: CreateWebhookRequest): Promise<Webhook> {
    const webhook = await createWebhookApi(request);
    webhooks = [webhook, ...webhooks];
    return webhook;
  }

  function openEditSheet(webhook: Webhook) {
    editingWebhook = webhook;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingWebhook = null;
  }

  async function modifyWebhook(
    id: string,
    request: Omit<UpdateWebhookRequest, "webhookId">,
  ): Promise<void> {
    const updated = await updateWebhookApi(id, request);
    webhooks = webhooks.map((w) => (w.id === updated.id ? updated : w));
    if (editingWebhook?.id === updated.id) {
      editingWebhook = updated;
    }
  }

  async function removeWebhook(id: string): Promise<void> {
    await deleteWebhookApi(id);
    webhooks = webhooks.filter((w) => w.id !== id);
  }

  async function duplicateWebhook(id: string): Promise<void> {
    const copied = await copyWebhookApi(id);
    webhooks = [copied, ...webhooks];
  }

  async function testWebhookById(
    id: string,
  ): Promise<TestWebhookResponse> {
    return testWebhookApi(id);
  }

  return {
    get webhooks() {
      return webhooks;
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
    get editingWebhook() {
      return editingWebhook;
    },
    get filteredWebhooks() {
      return filteredWebhooks;
    },
    get paginatedWebhooks() {
      return paginatedWebhooks;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },

    loadWebhooks,
    setSearchQuery,
    setPage,
    addWebhook,
    openEditSheet,
    closeEditSheet,
    modifyWebhook,
    removeWebhook,
    duplicateWebhook,
    testWebhookById,
  };
}

export const webhookStore = createWebhookStore();
