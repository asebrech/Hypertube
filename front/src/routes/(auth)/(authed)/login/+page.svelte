<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form action="?/login" method="POST" use:enhance>
			<div class="grid gap-4">
				<div class="grid gap-2">
					{#if form?.credentials}
						<p class="error">You have entered the wrong credentials.</p>
					{/if}
					<Label for="email">Email</Label>
					<Input id="email" type="email" name="email" placeholder="m@example.com" required />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password">Password</Label>
						<a href="##" class="ml-auto inline-block text-sm underline"> Forgot your password? </a>
					</div>
					<Input id="password" type="password" name="password" required />
				</div>
				<Button type="submit" class="w-full">Login</Button>
				<Button variant="outline" class="w-full">Login with Google</Button>
			</div>
			<div class="mt-4 text-center text-sm">
				Don&apos;t have an account?
				<a href="/register" class="underline">Sign up</a>
			</div>
		</form>
	</Card.Content>
</Card.Root>
