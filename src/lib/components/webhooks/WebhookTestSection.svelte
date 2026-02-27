<script lang="ts">
  import type { TestWebhookResponse } from '$lib/api/generated/types.gen'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Send, CheckCircle, XCircle } from 'lucide-svelte'

  let {
    webhookId = undefined,
    onTest,
  }: {
    webhookId?: string
    onTest?: (id: string) => Promise<TestWebhookResponse>
  } = $props()

  let testing = $state(false)
  let testResult = $state<TestWebhookResponse | null>(null)
  let testError = $state<string | null>(null)

  const testSuccess = $derived(
    testResult !== null && (testResult.statusCode ?? 0) >= 200 && (testResult.statusCode ?? 0) < 300,
  )

  async function handleTest() {
    if (!webhookId || !onTest) return
    testing = true
    testResult = null
    testError = null
    try {
      testResult = await onTest(webhookId)
    } catch (e) {
      testError = e instanceof Error ? e.message : 'Test failed'
    } finally {
      testing = false
    }
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Test</h3>
  </div>

  <div class="rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-sm text-warning">
    This step is required for saving changes.
  </div>

  <p class="text-sm text-muted-foreground">
    Test the webhook to validate the URL and headers.
  </p>

  <Button
    variant="outline"
    size="sm"
    onclick={handleTest}
    disabled={!webhookId || testing}
  >
    <Send size={14} class="mr-1.5" />
    {testing ? 'Testing...' : 'Test Webhook'}
  </Button>

  {#if testResult}
    <div
      class="rounded-md px-3 py-2 text-sm {testSuccess
        ? 'bg-success/10 text-success'
        : 'bg-destructive/10 text-destructive'}"
    >
      <div class="flex items-center gap-1.5">
        {#if testSuccess}
          <CheckCircle size={14} />
          <span>Status: {testResult.statusCode}</span>
        {:else}
          <XCircle size={14} />
          <span>Status: {testResult.statusCode ?? 'Error'}</span>
        {/if}
      </div>
      {#if testResult.responseBody}
        <pre class="mt-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
{testResult.responseBody}
        </pre>
      {/if}
    </div>
  {/if}

  {#if testError}
    <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {testError}
    </div>
  {/if}
</div>
