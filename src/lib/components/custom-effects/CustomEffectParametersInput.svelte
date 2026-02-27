<script lang="ts">
  import type { CustomEffectParameter } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Trash2, Plus, GripVertical } from 'lucide-svelte'

  let {
    parameters = $bindable<CustomEffectParameter[]>([]),
    disabled = false,
  }: {
    parameters: CustomEffectParameter[]
    disabled?: boolean
  } = $props()

  const PARAM_TYPES = [
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING', label: 'string' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_NUMBER', label: 'number' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_BOOLEAN', label: 'boolean' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_TIME', label: 'time' },
  ] as const

  function addParameter() {
    parameters = [
      ...parameters,
      { type: 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING', name: '', description: '' },
    ]
  }

  function removeParameter(index: number) {
    parameters = parameters.filter((_, i) => i !== index)
  }

  function updateParameter(index: number, field: keyof CustomEffectParameter, val: string) {
    parameters = parameters.map((p, i) => (i === index ? { ...p, [field]: val } : p))
  }

  function getTypeLabel(type: string | undefined): string {
    return PARAM_TYPES.find((t) => t.value === type)?.label ?? 'string'
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Parameters</h3>
  </div>

  {#if parameters.length > 0}
    <div class="space-y-2">
      <div class="grid grid-cols-[120px_1fr_1fr_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Param type</span>
        <span>Param name</span>
        <span>Param description</span>
        <span></span>
        <span></span>
      </div>
      {#each parameters as param, i (i)}
        <div class="grid grid-cols-[120px_1fr_1fr_auto_auto] gap-2 items-center">
          <Select.Root
            type="single"
            value={param.type ?? 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING'}
            onValueChange={(val) => { if (val) updateParameter(i, 'type', val) }}
            disabled={disabled}
          >
            <Select.Trigger class="w-full text-sm">
              {getTypeLabel(param.type)}
            </Select.Trigger>
            <Select.Content>
              {#each PARAM_TYPES as pt (pt.value)}
                <Select.Item value={pt.value}>{pt.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>

          <Input
            value={param.name ?? ''}
            placeholder="Enter parameter name"
            oninput={(e: Event) => updateParameter(i, 'name', (e.target as HTMLInputElement).value)}
            disabled={disabled}
          />

          <Input
            value={param.description ?? ''}
            placeholder="Enter the description of the parameter"
            oninput={(e: Event) => updateParameter(i, 'description', (e.target as HTMLInputElement).value)}
            disabled={disabled}
          />

          <div class="text-muted-foreground cursor-grab">
            <GripVertical size={16} />
          </div>

          <button
            class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            onclick={() => removeParameter(i)}
            disabled={disabled}
          >
            <Trash2 size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <Button variant="ghost" size="sm" class="text-primary" onclick={addParameter} disabled={disabled}>
    <Plus size={14} class="mr-1" />
    Add
  </Button>
</div>
