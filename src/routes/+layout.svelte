<script lang="ts">
  import '$lib/api/client';
  import '../app.css'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let { children } = $props()
</script>

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
