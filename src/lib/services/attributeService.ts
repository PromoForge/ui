import {
  backstageServiceListAttributes,
  backstageServiceCreateAttribute,
  backstageServiceUpdateAttribute,
  backstageServiceDeleteAttribute,
  backstageServiceArchiveAttribute,
} from "$lib/api/generated";
import type {
  Attribute,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  ArchiveAttributeRequest,
} from "$lib/api/generated/types.gen";

export async function listAttributes(): Promise<{
  data: Attribute[];
  total: number;
}> {
  const { data, error } = await backstageServiceListAttributes({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load attributes");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createAttribute(
  request: CreateAttributeRequest,
): Promise<Attribute> {
  const { data, error } = await backstageServiceCreateAttribute({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create attribute");
  }
  return data!.attribute!;
}

export async function updateAttribute(
  attributeId: number,
  request: Omit<UpdateAttributeRequest, "attributeId">,
): Promise<Attribute> {
  const { data, error } = await backstageServiceUpdateAttribute({
    path: { attributeId },
    body: { ...request, attributeId },
  });
  if (error) {
    throw new Error("Failed to update attribute");
  }
  return data!.attribute!;
}

export async function deleteAttribute(attributeId: number): Promise<void> {
  const { error } = await backstageServiceDeleteAttribute({
    path: { attributeId },
  });
  if (error) {
    throw new Error("Failed to delete attribute");
  }
}

export async function archiveAttribute(
  attributeId: number,
  request: ArchiveAttributeRequest,
): Promise<void> {
  const { error } = await backstageServiceArchiveAttribute({
    path: { attributeId },
    body: request,
  });
  if (error) {
    throw new Error("Failed to archive attribute");
  }
}
