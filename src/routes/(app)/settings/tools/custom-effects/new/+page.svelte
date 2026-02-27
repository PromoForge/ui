<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { customEffectStore } from '$lib/stores/customEffectStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import type { CreateCustomEffectRequest } from '$lib/api/generated/types.gen'
  import CustomEffectForm from '$lib/components/custom-effects/CustomEffectForm.svelte'

  let saving = $state(false)

  onMount(() => {
    applicationStore.loadApplications()
  })
</script>

<div class="flex flex-col h-full">
  <div class="flex-1 overflow-y-auto px-8 py-8 max-w-4xl">
    <CustomEffectForm
      mode="create"
      applications={applicationStore.applications}
      {saving}
      onSubmit={async (data) => {
        saving = true
        try {
          await customEffectStore.addCustomEffect({
            apiName: data.apiName,
            ruleBuilderName: data.ruleBuilderName,
            description: data.description,
            scope: data.scope as CreateCustomEffectRequest['scope'],
            applicationIds: data.applicationIds,
            parameters: data.parameters,
            payload: data.payload,
          })
          goto('/settings/tools/custom-effects')
        } catch (e) {
          console.error('Failed to create custom effect:', e)
        } finally {
          saving = false
        }
      }}
      onCancel={() => goto('/settings/tools/custom-effects')}
    />
  </div>
</div>
