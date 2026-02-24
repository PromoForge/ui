<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { CircleAlert, Check } from 'lucide-svelte'

  let {
    application
  }: {
    application: Application
  } = $props()

  const settings = $derived(application.settings ?? {})

  let defaultDiscountScope = $state<string>('DISCOUNT_SCOPE_SESSION_TOTAL')
  let enableCascadingDiscounts = $state(false)
  let enableFlattenedCartItems = $state(false)
  let enablePartialDiscounts = $state(false)
  let enableCampaignStateManagement = $state(false)
  let defaultDiscountAdditionalCostPerItemScope = $state<string>('DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_PRICE')
  let saving = $state(false)
  let error = $state('')
  let success = $state(false)

  $effect(() => {
    defaultDiscountScope = settings.defaultDiscountScope ?? 'DISCOUNT_SCOPE_SESSION_TOTAL'
    enableCascadingDiscounts = settings.enableCascadingDiscounts ?? false
    enableFlattenedCartItems = settings.enableFlattenedCartItems ?? false
    enablePartialDiscounts = settings.enablePartialDiscounts ?? false
    enableCampaignStateManagement = settings.enableCampaignStateManagement ?? false
    defaultDiscountAdditionalCostPerItemScope = settings.defaultDiscountAdditionalCostPerItemScope ?? 'DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_PRICE'
  })

  const hasChanges = $derived(
    defaultDiscountScope !== (settings.defaultDiscountScope ?? 'DISCOUNT_SCOPE_SESSION_TOTAL') ||
    enableCascadingDiscounts !== (settings.enableCascadingDiscounts ?? false) ||
    enableFlattenedCartItems !== (settings.enableFlattenedCartItems ?? false) ||
    enablePartialDiscounts !== (settings.enablePartialDiscounts ?? false) ||
    enableCampaignStateManagement !== (settings.enableCampaignStateManagement ?? false) ||
    defaultDiscountAdditionalCostPerItemScope !== (settings.defaultDiscountAdditionalCostPerItemScope ?? 'DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_PRICE')
  )

  const discountScopeOptions = [
    { value: 'DISCOUNT_SCOPE_SESSION_TOTAL', label: 'Session Total', description: 'Discounts apply to the entire session total' },
    { value: 'DISCOUNT_SCOPE_CART_ITEMS', label: 'Cart Items', description: 'Discounts apply to individual cart items' },
    { value: 'DISCOUNT_SCOPE_ADDITIONAL_COSTS', label: 'Additional Costs', description: 'Discounts apply to additional costs only' }
  ]

  const additionalCostScopeOptions = [
    { value: 'DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_PRICE', label: 'Item Price', description: 'Discount calculated from the item price' },
    { value: 'DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_ADDITIONAL_COSTS', label: 'Additional Costs', description: 'Discount calculated from additional costs' }
  ]

  function handleCancel() {
    defaultDiscountScope = settings.defaultDiscountScope ?? 'DISCOUNT_SCOPE_SESSION_TOTAL'
    enableCascadingDiscounts = settings.enableCascadingDiscounts ?? false
    enableFlattenedCartItems = settings.enableFlattenedCartItems ?? false
    enablePartialDiscounts = settings.enablePartialDiscounts ?? false
    enableCampaignStateManagement = settings.enableCampaignStateManagement ?? false
    defaultDiscountAdditionalCostPerItemScope = settings.defaultDiscountAdditionalCostPerItemScope ?? 'DISCOUNT_ADDITIONAL_COST_PER_ITEM_SCOPE_PRICE'
    error = ''
    success = false
  }

  async function handleSave() {
    saving = true
    error = ''
    success = false
    try {
      await applicationStore.updateApplicationSettings(application.id!, {
        defaultDiscountScope: defaultDiscountScope as any,
        enableCascadingDiscounts,
        enableFlattenedCartItems,
        enablePartialDiscounts,
        enableCampaignStateManagement,
        defaultDiscountAdditionalCostPerItemScope: defaultDiscountAdditionalCostPerItemScope as any
      })
      success = true
      setTimeout(() => (success = false), 3000)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update settings'
    } finally {
      saving = false
    }
  }
</script>

<div class="max-w-2xl">
  <p class="text-sm text-muted-foreground">
    Configure how the promotion engine evaluates discounts for this application.
  </p>

  {#if error}
    <Alert.Root variant="destructive" class="mt-4">
      <CircleAlert class="size-4" />
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if success}
    <Alert.Root class="mt-4 border-success/30 bg-success/5 text-success">
      <Check class="size-4" />
      <Alert.Description>Settings saved successfully.</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Discount Scope -->
  <Card.Root class="mt-6">
    <Card.Header>
      <Card.Title class="text-base">Discount Scope</Card.Title>
      <Card.Description>
        Choose how discounts are applied by default when campaigns are evaluated.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5">
      <div class="flex flex-col gap-1.5">
        <Label class="text-sm font-medium">Default Discount Scope</Label>
        <Select.Root type="single" bind:value={defaultDiscountScope}>
          <Select.Trigger class="w-64">
            {discountScopeOptions.find(o => o.value === defaultDiscountScope)?.label ?? 'Select...'}
          </Select.Trigger>
          <Select.Content>
            {#each discountScopeOptions as option (option.value)}
              <Select.Item value={option.value} label={option.label}>
                <div class="flex flex-col">
                  <span>{option.label}</span>
                  <span class="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <Separator />

      <div class="flex flex-col gap-1.5">
        <Label class="text-sm font-medium">Additional Cost Discount Scope</Label>
        <p class="text-xs text-muted-foreground">Controls how per-item additional cost discounts are calculated.</p>
        <Select.Root type="single" bind:value={defaultDiscountAdditionalCostPerItemScope}>
          <Select.Trigger class="w-64">
            {additionalCostScopeOptions.find(o => o.value === defaultDiscountAdditionalCostPerItemScope)?.label ?? 'Select...'}
          </Select.Trigger>
          <Select.Content>
            {#each additionalCostScopeOptions as option (option.value)}
              <Select.Item value={option.value} label={option.label}>
                <div class="flex flex-col">
                  <span>{option.label}</span>
                  <span class="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Feature Toggles -->
  <Card.Root class="mt-4">
    <Card.Header>
      <Card.Title class="text-base">Engine Behavior</Card.Title>
      <Card.Description>
        Toggle features that control how the promotion engine processes sessions.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-0">
      <div class="flex items-center justify-between py-4">
        <div class="space-y-0.5">
          <Label class="text-sm font-medium">Cascading Discounts</Label>
          <p class="text-xs text-muted-foreground">Allow multiple discounts to stack on the same item.</p>
        </div>
        <Switch bind:checked={enableCascadingDiscounts} />
      </div>

      <Separator />

      <div class="flex items-center justify-between py-4">
        <div class="space-y-0.5">
          <Label class="text-sm font-medium">Flattened Cart Items</Label>
          <p class="text-xs text-muted-foreground">Treat each unit as a separate line item (quantity = 1 per line).</p>
        </div>
        <Switch bind:checked={enableFlattenedCartItems} />
      </div>

      <Separator />

      <div class="flex items-center justify-between py-4">
        <div class="space-y-0.5">
          <Label class="text-sm font-medium">Partial Discounts</Label>
          <p class="text-xs text-muted-foreground">Allow partial discounts when the campaign budget is insufficient for the full amount.</p>
        </div>
        <Switch bind:checked={enablePartialDiscounts} />
      </div>

      <Separator />

      <div class="flex items-center justify-between py-4">
        <div class="space-y-0.5">
          <Label class="text-sm font-medium">Campaign State Management</Label>
          <p class="text-xs text-muted-foreground">Enable tracking of campaign state transitions and lifecycle events.</p>
        </div>
        <Switch bind:checked={enableCampaignStateManagement} />
      </div>
    </Card.Content>
  </Card.Root>

  <div class="mt-6 flex items-center justify-end gap-3">
    <Button variant="ghost" onclick={handleCancel} disabled={saving}>Cancel</Button>
    <Button onclick={handleSave} disabled={!hasChanges || saving}>
      {#if saving}
        Saving...
      {:else if hasChanges}
        Save Changes
      {:else}
        No Changes
      {/if}
    </Button>
  </div>
</div>
