import { mockApplications } from '$lib/mocks/applications'
import type { Application } from '$lib/types'

// GET /v1/applications
export async function getApplications(): Promise<Application[]> {
  return mockApplications
}

// GET /v1/applications/:id
export async function getApplication(id: string): Promise<Application | undefined> {
  return mockApplications.find((app) => app.id === id)
}
