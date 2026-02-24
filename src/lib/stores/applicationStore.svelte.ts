import { getApplications, updateApplication as updateApplicationApi } from '$lib/services/applicationService'
import type { Application, UpdateApplicationRequest } from '$lib/api/generated/types.gen'

function createApplicationStore() {
  let applications = $state<Application[]>([])
  let selectedId = $state<string | null>(null)
  let searchQuery = $state('')
  let loading = $state(false)

  const selectedApplication = $derived(
    applications.find((a) => String(a.id) === selectedId) ?? null
  )

  const filteredApplications = $derived(
    searchQuery
      ? applications.filter((a) =>
          (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : applications
  )

  async function loadApplications() {
    loading = true
    try {
      applications = await getApplications()
      if (applications.length > 0 && !selectedId) {
        selectedId = String(applications[0].id)
      }
    } finally {
      loading = false
    }
  }

  function selectApplication(id: string) {
    selectedId = id
  }

  function setSearchQuery(query: string) {
    searchQuery = query
  }

  async function updateApplication(id: number, request: UpdateApplicationRequest): Promise<void> {
    const updated = await updateApplicationApi(id, request)
    applications = applications.map((a) => (a.id === updated.id ? updated : a))
  }

  return {
    get applications() { return applications },
    get selectedId() { return selectedId },
    get selectedApplication() { return selectedApplication },
    get filteredApplications() { return filteredApplications },
    get searchQuery() { return searchQuery },
    get loading() { return loading },
    loadApplications,
    selectApplication,
    setSearchQuery,
    updateApplication
  }
}

export const applicationStore = createApplicationStore()
