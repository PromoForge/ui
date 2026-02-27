<script lang="ts">
  import type { WebhookParameter } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Trash2, Plus } from 'lucide-svelte'

  let {
    parameters = $bindable<WebhookParameter[]>([]),
  }: {
    parameters: WebhookParameter[]
  } = $props()

  const PARAM_TYPES = [
    { value: 'WEBHOOK_PARAMETER_TYPE_STRING', label: 'String' },
    { value: 'WEBHOOK_PARAMETER_TYPE_NUMBER', label: 'Number' },
    { value: 'WEBHOOK_PARAMETER_TYPE_BOOLEAN', label: 'Boolean' },
    { value: 'WEBHOOK_PARAMETER_TYPE_TIME', label: 'Time' },
    { value: 'WEBHOOK_PARAMETER_TYPE_LONG_STRING', label: 'Long String' },
  ] as const

  function addParameter() {
    parameters = [
      ...parameters,
      { type: 'WEBHOOK_PARAMETER_TYPE_STRING', name: '', description: '' },
    ]
  }

  function removeParameter(index: number) {
    parameters = parameters.filter((_, i) => i !== index)
  }

  function updateParameter(index: number, field: keyof WebhookParameter, val: string) {
    parameters = parameters.map((p, i) => (i === index ? { ...p, [field]: val } : p))
  }

  function getTypeLabel(type: string | undefined): string {
    return PARAM_TYPES.find((t) => t.value === type)?.label ?? 'String'
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Parameters (optional)</h3>
    <p class="text-sm text-muted-foreground mt-1">
      Specify the information to send to the destination as key-value pairs.
    </p>
  </div>

  {#each parameters as param, i (i)}
    <div class="relative rounded-md border p-4 space-y-3">
      <button
        class="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        onclick={() => removeParameter(i)}
      >
        <Trash2 size={14} />
      </button>

      <div class="space-y-1.5 pr-8">
        <span class="text-sm font-medium">Type</span>
        <Select.Root
          type="single"
          value={param.type ?? 'WEBHOOK_PARAMETER_TYPE_STRING'}
          onValueChange={(val) => { if (val) updateParameter(i, 'type', val) }}
        >
          <Select.Trigger class="w-full">
            {getTypeLabel(param.type)}
          </Select.Trigger>
          <Select.Content>
            {#each PARAM_TYPES as pt (pt.value)}
              <Select.Item value={pt.value}>{pt.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-1.5">
        <span class="text-sm font-medium">Name</span>
        <Input
          value={param.name ?? ''}
          placeholder="Parameter name"
          oninput={(e: Event) => updateParameter(i, 'name', (e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-1.5">
        <span class="text-sm font-medium">Description (optional)</span>
        <Input
          value={param.description ?? ''}
          placeholder="Parameter description"
          oninput={(e: Event) =>
            updateParameter(i, 'description', (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  {/each}

  <Button variant="ghost" size="sm" class="text-primary" onclick={addParameter}>
    <Plus size={14} class="mr-1" />
    Add Parameter
  </Button>
</div>
