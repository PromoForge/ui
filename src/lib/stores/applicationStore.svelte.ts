import { getApplications } from '$lib/services/applicationService'
import type { Application } from '$lib/types'

function createApplicationStore() {
  let applications = $state<Application[]>([])
  let selectedId = $state<string | null>(null)
  let searchQuery = $state('')
  let loading = $state(false)

  const selectedApplication = $derived(
    applications.find((a) => a.id === selectedId) ?? null
  )

  const filteredApplications = $derived(
    searchQuery
      ? applications.filter((a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : applications
  )

  async function loadApplications() {
    loading = true
    try {
      applications = await getApplications()
      if (applications.length > 0 && !selectedId) {
        selectedId = applications[0].id
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

  return {
    get applications() { return applications },
    get selectedId() { return selectedId },
    get selectedApplication() { return selectedApplication },
    get filteredApplications() { return filteredApplications },
    get searchQuery() { return searchQuery },
    get loading() { return loading },
    loadApplications,
    selectApplication,
    setSearchQuery
  }
}

export const applicationStore = createApplicationStore()
