<script lang="ts">
	let { form } = $props();
	import { enhance } from '$app/forms';
</script>

<h1>Register</h1>

<form action="?/register" method="POST" use:enhance>
	<div>
		<label for="email">email</label>
		<input id="email" name="email" type="text" required />
	</div>

	<div>
		<label for="password">Password</label>
		<input id="password" name="password" type="password" required />
	</div>

	{#if form?.invalid}
		<p class="error">Invalid credentials</p>
	{/if}

	<button type="submit">Register</button>
</form>
