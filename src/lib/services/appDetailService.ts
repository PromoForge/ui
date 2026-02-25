import { mockAppDetailData } from "$lib/mocks/appDetail";
import type { AppDetailData } from "$lib/types";

// GET /v1/applications/:applicationId/detail
export async function getAppDetailData(
  applicationId: string,
): Promise<AppDetailData | null> {
  return mockAppDetailData[applicationId] ?? null;
}
