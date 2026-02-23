import {
  backstageServiceListApplications,
  backstageServiceGetApplication,
  backstageServiceCreateApplication
} from '$lib/api/generated'
import type { Application, CreateApplicationRequest } from '$lib/api/generated/types.gen'

export async function getApplications(): Promise<Application[]> {
  const { data, error } = await backstageServiceListApplications()
  if (error) {
    throw new Error('Failed to load applications')
  }
  return data?.data ?? []
}

export async function getApplication(id: number): Promise<Application | undefined> {
  const { data, error } = await backstageServiceGetApplication({
    path: { applicationId: id }
  })
  if (error) {
    throw new Error('Failed to load application')
  }
  return data?.application
}

export async function createApplication(
  request: CreateApplicationRequest
): Promise<Application> {
  const { data, error } = await backstageServiceCreateApplication({
    body: request
  })
  if (error) {
    throw new Error('Failed to create application')
  }
  return data!.application!
}
