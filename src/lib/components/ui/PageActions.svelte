<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { ExternalLink, ChevronDown } from 'lucide-svelte'
</script>

<div class="flex items-center gap-2">
  <Button variant="link" class="gap-1 text-primary">
    <ExternalLink size={14} />
    Documentation
  </Button>
  <Button variant="outline" class="gap-1">
    Manage Campaign Data
    <ChevronDown size={14} />
  </Button>
</div>
