<script lang="ts">
	const navItems = [
		{ label: 'Dashboard', href: '/', icon: 'home' },
		{ label: 'Settings', href: '/settings', icon: 'settings' }
	];
</script>

<aside class="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
	<div class="flex h-16 items-center border-b border-gray-200 px-6">
		<span class="text-xl font-bold text-gray-900">PromoForge</span>
	</div>
	<nav class="flex-1 space-y-1 px-3 py-4">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
			>
				{item.label}
			</a>
		{/each}
	</nav>
</aside>
