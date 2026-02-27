import {
  backstageServiceListAccountCollections,
  backstageServiceCreateAccountCollection,
  backstageServiceUpdateAccountCollection,
  backstageServiceDeleteAccountCollection,
  backstageServiceImportAccountCollectionItems,
  backstageServiceExportAccountCollectionItems,
} from "$lib/api/generated";
import type {
  Collection,
  CreateAccountCollectionRequest,
  UpdateAccountCollectionRequest,
} from "$lib/api/generated/types.gen";

export async function listCollections(): Promise<{
  data: Collection[];
  total: number;
}> {
  const { data, error } = await backstageServiceListAccountCollections({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load collections");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createCollection(
  request: CreateAccountCollectionRequest,
): Promise<Collection> {
  const { data, error } = await backstageServiceCreateAccountCollection({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create collection");
  }
  return data!.collection!;
}

export async function updateCollection(
  collectionId: number,
  request: Omit<UpdateAccountCollectionRequest, "collectionId">,
): Promise<Collection> {
  const { data, error } = await backstageServiceUpdateAccountCollection({
    path: { collectionId },
    body: { ...request, collectionId },
  });
  if (error) {
    throw new Error("Failed to update collection");
  }
  return data!.collection!;
}

export async function deleteCollection(collectionId: number): Promise<void> {
  const { error } = await backstageServiceDeleteAccountCollection({
    path: { collectionId },
  });
  if (error) {
    throw new Error("Failed to delete collection");
  }
}

export async function importCollectionItems(
  collectionId: number,
  csvData: string,
): Promise<Collection> {
  // Proto bytes fields require base64 encoding in JSON
  const encoded = btoa(csvData);
  const { data, error } = await backstageServiceImportAccountCollectionItems({
    path: { collectionId },
    body: { collectionId, csvData: encoded },
  });
  if (error) {
    throw new Error("Failed to import collection items");
  }
  return data!.collection!;
}

export async function exportCollectionItems(
  collectionId: number,
): Promise<string> {
  const { data, error } = await backstageServiceExportAccountCollectionItems({
    path: { collectionId },
  });
  if (error) {
    throw new Error("Failed to export collection items");
  }
  // Proto bytes fields are base64 encoded in JSON
  const encoded = data?.csvData ?? "";
  return encoded ? atob(encoded) : "";
}
