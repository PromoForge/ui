import {
  backstageServiceListAdditionalCosts,
  backstageServiceCreateAdditionalCost,
  backstageServiceUpdateAdditionalCost,
  backstageServiceDeleteAdditionalCost,
} from "$lib/api/generated";
import type {
  AdditionalCost,
  CreateAdditionalCostRequest,
  UpdateAdditionalCostRequest,
} from "$lib/api/generated/types.gen";

export async function listAdditionalCosts(): Promise<{
  data: AdditionalCost[];
  total: number;
}> {
  const { data, error } = await backstageServiceListAdditionalCosts({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load additional costs");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createAdditionalCost(
  request: CreateAdditionalCostRequest,
): Promise<AdditionalCost> {
  const { data, error } = await backstageServiceCreateAdditionalCost({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create additional cost");
  }
  return data!.additionalCost!;
}

export async function updateAdditionalCost(
  additionalCostId: number,
  request: Omit<UpdateAdditionalCostRequest, "additionalCostId">,
): Promise<AdditionalCost> {
  const { data, error } = await backstageServiceUpdateAdditionalCost({
    path: { additionalCostId },
    body: { ...request, additionalCostId },
  });
  if (error) {
    throw new Error("Failed to update additional cost");
  }
  return data!.additionalCost!;
}

export async function deleteAdditionalCost(
  additionalCostId: number,
): Promise<void> {
  const { error } = await backstageServiceDeleteAdditionalCost({
    path: { additionalCostId },
  });
  if (error) {
    throw new Error("Failed to delete additional cost");
  }
}
