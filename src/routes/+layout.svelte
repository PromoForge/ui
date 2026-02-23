<script lang="ts">
  import '$lib/api/client';
  import '../app.css'

  let { children } = $props()
</script>

{@render children()}
