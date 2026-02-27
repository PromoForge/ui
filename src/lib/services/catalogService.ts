import {
  backstageServiceListCatalogs,
  backstageServiceCreateCatalog,
  backstageServiceGetCatalog,
  backstageServiceUpdateCatalog,
  backstageServiceDeleteCatalog,
  backstageServiceListCatalogItems,
} from "$lib/api/generated";
import type {
  Catalog,
  CatalogItem,
  CreateCatalogRequest,
  UpdateCatalogRequest,
} from "$lib/api/generated/types.gen";

export async function listCatalogs(): Promise<{
  data: Catalog[];
  total: number;
}> {
  const { data, error } = await backstageServiceListCatalogs({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load catalogs");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createCatalog(
  request: CreateCatalogRequest,
): Promise<Catalog> {
  const { data, error } = await backstageServiceCreateCatalog({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create catalog");
  }
  return data!.catalog!;
}

export async function getCatalog(catalogId: number): Promise<Catalog> {
  const { data, error } = await backstageServiceGetCatalog({
    path: { catalogId },
  });
  if (error) {
    throw new Error("Failed to load catalog");
  }
  return data!.catalog!;
}

export async function updateCatalog(
  catalogId: number,
  request: Omit<UpdateCatalogRequest, "catalogId">,
): Promise<Catalog> {
  const { data, error } = await backstageServiceUpdateCatalog({
    path: { catalogId },
    body: { ...request, catalogId },
  });
  if (error) {
    throw new Error("Failed to update catalog");
  }
  return data!.catalog!;
}

export async function deleteCatalog(catalogId: number): Promise<void> {
  const { error } = await backstageServiceDeleteCatalog({
    path: { catalogId },
  });
  if (error) {
    throw new Error("Failed to delete catalog");
  }
}

export async function listCatalogItems(
  catalogId: number,
  pageSize = 50,
  skip = 0,
): Promise<{ data: CatalogItem[]; total: number }> {
  const { data, error } = await backstageServiceListCatalogItems({
    path: { catalogId },
    query: { pageSize, skip },
  });
  if (error) {
    throw new Error("Failed to load catalog items");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}
