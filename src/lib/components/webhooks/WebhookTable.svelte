<script lang="ts">
  import type { Webhook, Application } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { LayoutGrid, Copy } from 'lucide-svelte'

  let {
    webhooks,
    applications = [],
    onEdit,
    onCopy,
  }: {
    webhooks: Webhook[]
    applications?: Application[]
    onEdit?: (webhook: Webhook) => void
    onCopy?: (webhook: Webhook) => void
  } = $props()

  function getVerbLabel(verb: string | undefined): string {
    if (!verb) return '—'
    return verb.replace('WEBHOOK_VERB_', '')
  }

  function getAppDisplay(webhook: Webhook): { label: string; apps: Application[] } {
    const ids = webhook.connectedApplicationIds
    if (!ids || ids.length === 0) {
      return { label: 'All', apps: [] }
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
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Name
      </Table.Head>
      <Table.Head class="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Verb
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Copy
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each webhooks as webhook (webhook.id)}
      {@const appInfo = getAppDisplay(webhook)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell>
          <button
            class="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
            onclick={() => onEdit?.(webhook)}
          >
            {webhook.name ?? '—'}
          </button>
          {#if webhook.description}
            <p class="text-xs text-muted-foreground mt-0.5">{webhook.description}</p>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-sm text-foreground">
          {getVerbLabel(webhook.verb)}
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
              All
            </div>
          {/if}
        </Table.Cell>
        <Table.Cell>
          <button
            class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            onclick={() => onCopy?.(webhook)}
          >
            <Copy size={16} />
          </button>
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if webhooks.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No webhooks found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
