import {
  backstageServiceListWebhooks,
  backstageServiceCreateWebhook,
  backstageServiceGetWebhook,
  backstageServiceUpdateWebhook,
  backstageServiceDeleteWebhook,
  backstageServiceTestWebhook,
} from "$lib/api/generated";
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookResponse,
} from "$lib/api/generated/types.gen";

export async function listWebhooks(): Promise<{
  data: Webhook[];
  total: number;
}> {
  const { data, error } = await backstageServiceListWebhooks({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load webhooks");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function getWebhook(webhookId: string): Promise<Webhook> {
  const { data, error } = await backstageServiceGetWebhook({
    path: { webhookId },
  });
  if (error) {
    throw new Error("Failed to load webhook");
  }
  return data!.webhook!;
}

export async function createWebhook(
  request: CreateWebhookRequest,
): Promise<Webhook> {
  const { data, error } = await backstageServiceCreateWebhook({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create webhook");
  }
  return data!.webhook!;
}

export async function updateWebhook(
  webhookId: string,
  request: Omit<UpdateWebhookRequest, "webhookId">,
): Promise<Webhook> {
  const { data, error } = await backstageServiceUpdateWebhook({
    path: { webhookId },
    body: { ...request, webhookId },
  });
  if (error) {
    throw new Error("Failed to update webhook");
  }
  return data!.webhook!;
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const { error } = await backstageServiceDeleteWebhook({
    path: { webhookId },
  });
  if (error) {
    throw new Error("Failed to delete webhook");
  }
}

export async function testWebhook(
  webhookId: string,
): Promise<TestWebhookResponse> {
  const { data, error } = await backstageServiceTestWebhook({
    path: { webhookId },
    body: { webhookId },
  });
  if (error) {
    throw new Error("Failed to test webhook");
  }
  return data!;
}

export async function copyWebhook(webhookId: string): Promise<Webhook> {
  const original = await getWebhook(webhookId);
  return createWebhook({
    name: `${original.name} (Copy)`,
    description: original.description,
    verb: original.verb,
    url: original.url,
    headers: original.headers,
    parameters: original.parameters,
    payload: original.payload,
    applicationIds: original.connectedApplicationIds,
  });
}
