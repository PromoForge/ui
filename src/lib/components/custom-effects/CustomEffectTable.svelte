<script lang="ts">
  import type { CustomEffect, Application } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { LayoutGrid } from 'lucide-svelte'

  let {
    customEffects,
    applications = [],
    onEdit,
  }: {
    customEffects: CustomEffect[]
    applications?: Application[]
    onEdit?: (effect: CustomEffect) => void
  } = $props()

  function getScopeLabel(scope: string | undefined): string {
    if (scope === 'CUSTOM_EFFECT_SCOPE_SESSION') return 'Cart (Session)'
    if (scope === 'CUSTOM_EFFECT_SCOPE_CART_ITEM') return 'Item'
    return '—'
  }

  function getAppDisplay(effect: CustomEffect): { label: string; apps: Application[] } {
    const ids = effect.connectedApplicationIds
    if (!ids || ids.length === 0) {
      return { label: '0', apps: [] }
    }
    const matched = ids
      .map((id) => applications.find((a) => a.id === id))
      .filter((a): a is Application => !!a)
    return { label: String(ids.length), apps: matched }
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ID
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Title
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scope
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each customEffects as effect (effect.id)}
      {@const appInfo = getAppDisplay(effect)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell class="text-sm text-muted-foreground">
          {effect.id ?? '—'}
        </Table.Cell>
        <Table.Cell>
          <button
            class="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
            onclick={() => onEdit?.(effect)}
          >
            {effect.ruleBuilderName ?? '—'}
          </button>
          {#if effect.apiName}
            <p class="text-xs text-muted-foreground mt-0.5">{effect.apiName}</p>
          {/if}
        </Table.Cell>
        <Table.Cell>
          {#if appInfo.apps.length > 0}
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <LayoutGrid size={16} />
                  {appInfo.label}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <div class="space-y-1">
                  {#each appInfo.apps as app (app.id)}
                    <div class="flex items-center gap-1.5 text-sm">
                      <span class="h-2 w-2 rounded-sm bg-primary shrink-0"></span>
                      {app.name ?? 'Unknown'}
                    </div>
                  {/each}
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
          {:else}
            <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LayoutGrid size={16} />
              {appInfo.label}
            </div>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-sm text-foreground">
          {getScopeLabel(effect.scope)}
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if customEffects.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No custom effects found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
