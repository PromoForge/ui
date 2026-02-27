import {
  backstageServiceListCustomEffects,
  backstageServiceCreateCustomEffect,
  backstageServiceGetCustomEffect,
  backstageServiceUpdateCustomEffect,
  backstageServiceDeleteCustomEffect,
} from "$lib/api/generated";
import type {
  CustomEffect,
  CreateCustomEffectRequest,
  UpdateCustomEffectRequest,
} from "$lib/api/generated/types.gen";

export async function listCustomEffects(): Promise<{
  data: CustomEffect[];
  total: number;
}> {
  const { data, error } = await backstageServiceListCustomEffects({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load custom effects");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function getCustomEffect(customEffectId: number): Promise<CustomEffect> {
  const { data, error } = await backstageServiceGetCustomEffect({
    path: { customEffectId },
  });
  if (error) {
    throw new Error("Failed to load custom effect");
  }
  return data!.customEffect!;
}

export async function createCustomEffect(
  request: CreateCustomEffectRequest,
): Promise<CustomEffect> {
  const { data, error } = await backstageServiceCreateCustomEffect({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create custom effect");
  }
  return data!.customEffect!;
}

export async function updateCustomEffect(
  customEffectId: number,
  request: Omit<UpdateCustomEffectRequest, "customEffectId">,
): Promise<CustomEffect> {
  const { data, error } = await backstageServiceUpdateCustomEffect({
    path: { customEffectId },
    body: { ...request, customEffectId },
  });
  if (error) {
    throw new Error("Failed to update custom effect");
  }
  return data!.customEffect!;
}

export async function deleteCustomEffect(customEffectId: number): Promise<void> {
  const { error } = await backstageServiceDeleteCustomEffect({
    path: { customEffectId },
  });
  if (error) {
    throw new Error("Failed to delete custom effect");
  }
}
