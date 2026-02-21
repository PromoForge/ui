<script lang="ts">
  import { ExternalLink, ChevronDown } from 'lucide-svelte'
</script>

<div class="flex items-center gap-2">
  <button class="flex items-center gap-1.5 text-sm text-primary hover:underline">
    <ExternalLink size={14} />
    Documentation
  </button>
  <button class="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink">
    Manage Campaign Data
    <ChevronDown size={14} class="text-gray-400" />
  </button>
</div>
