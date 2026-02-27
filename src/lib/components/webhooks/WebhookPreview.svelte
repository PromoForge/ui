<script lang="ts">
  import type { WebhookHeader } from '$lib/api/generated/types.gen'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Copy } from 'lucide-svelte'

  let {
    verb = 'POST',
    url = '',
    headers = [],
    payload = '',
  }: {
    verb?: string
    url?: string
    headers?: WebhookHeader[]
    payload?: string
  } = $props()

  function getVerbLabel(v: string): string {
    return v.replace('WEBHOOK_VERB_', '') || 'POST'
  }

  const curlCommand = $derived.by(() => {
    const parts: string[] = ['curl']

    const method = getVerbLabel(verb)
    if (method !== 'GET') {
      parts.push(`-X ${method}`)
    }

    // Default headers
    parts.push(`-H 'X-UUID: (generated)'`)
    parts.push(`-H 'Content-Type: application/json'`)

    // User headers
    for (const h of headers) {
      if (h.key?.trim()) {
        parts.push(`-H '${h.key}: ${h.value ?? ''}'`)
      }
    }

    if (payload.trim()) {
      // Escape single quotes in payload for curl
      const escaped = payload.replace(/'/g, "'\\''")
      parts.push(`-d '${escaped}'`)
    }

    parts.push(`'${url || '<URL>'}'`)

    return parts.join(' \\\n  ')
  })

  let copied = $state(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(curlCommand)
      copied = true
      setTimeout(() => { copied = false }, 2000)
    } catch {
      // Clipboard not available
    }
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Preview</h3>
    <p class="text-sm text-muted-foreground mt-1">
      Preview the information to send to the destination.
    </p>
  </div>

  <div class="rounded-md bg-muted p-3 overflow-x-auto">
    <pre class="text-xs font-mono text-foreground whitespace-pre-wrap">{curlCommand}</pre>
  </div>

  <Button variant="outline" size="sm" onclick={copyToClipboard}>
    <Copy size={14} class="mr-1.5" />
    {copied ? 'Copied!' : 'Copy'}
  </Button>
</div>
