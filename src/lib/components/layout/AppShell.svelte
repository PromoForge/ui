<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import Header from './Header.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen bg-gray-50">
	<Sidebar />
	<div class="flex flex-1 flex-col overflow-hidden">
		<Header />
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
