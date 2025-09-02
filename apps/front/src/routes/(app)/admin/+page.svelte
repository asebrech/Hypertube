<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Redirect if user is not logged in or not admin
	$effect(() => {
		if (!page.data.user) {
			goto('/login');
		} else if (page.data.user.role !== 'admin') {
			goto('/');
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-white">
		{$_('navbar.admin_dashboard')}
	</h1>

	<p class="mt-4 text-gray-300">Admin panel - Coming soon...</p>
</div>
