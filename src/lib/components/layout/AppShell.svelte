<script lang="ts">
  import type { Snippet } from 'svelte'
  import DashboardLayout from './DashboardLayout.svelte'

  let { sidebar, children }: {
    sidebar: Snippet
    children: Snippet
  } = $props()
</script>

<DashboardLayout {sidebar}>
  {@render children()}
</DashboardLayout>
