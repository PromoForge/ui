<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { customEffectStore } from '$lib/stores/customEffectStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import type { CustomEffect } from '$lib/api/generated/types.gen'
  import CustomEffectForm from '$lib/components/custom-effects/CustomEffectForm.svelte'

  let customEffect = $state<CustomEffect | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let saving = $state(false)

  const effectId = $derived(Number($page.params.id))

  onMount(async () => {
    applicationStore.loadApplications()
    try {
      customEffect = await customEffectStore.fetchCustomEffect(effectId)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load custom effect'
    } finally {
      loading = false
    }
  })
</script>

<div class="flex flex-col h-full">
  <!-- Breadcrumb -->
  <div class="px-8 pt-6 pb-2">
    <nav class="text-sm text-muted-foreground">
      <a href="/settings/tools/custom-effects" class="hover:text-foreground">Custom Effects</a>
      <span class="mx-1">›</span>
      <span class="text-foreground">{customEffect?.ruleBuilderName ?? '...'}</span>
    </nav>
  </div>

  <div class="flex-1 overflow-y-auto px-8 py-4 max-w-4xl">
    {#if loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading custom effect...</p>
      </div>
    {:else if error}
      <div class="flex items-center justify-center py-16">
        <p class="text-destructive">{error}</p>
      </div>
    {:else if customEffect}
      <CustomEffectForm
        mode="edit"
        {customEffect}
        applications={applicationStore.applications}
        {saving}
        onSave={async (data) => {
          saving = true
          try {
            customEffect = await customEffectStore.modifyCustomEffect(effectId, {
              ruleBuilderName: data.ruleBuilderName,
              description: data.description,
              applicationIds: data.applicationIds,
              parameters: data.parameters,
              payload: data.payload,
            })
          } catch (e) {
            console.error('Failed to update custom effect:', e)
          } finally {
            saving = false
          }
        }}
        onCancel={() => goto('/settings/tools/custom-effects')}
        onDelete={async () => {
          try {
            await customEffectStore.removeCustomEffect(effectId)
            goto('/settings/tools/custom-effects')
          } catch (e) {
            console.error('Failed to delete custom effect:', e)
          }
        }}
      />
    {/if}
  </div>
</div>
