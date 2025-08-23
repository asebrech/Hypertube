<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { form } = $props();
	import { enhance } from '$app/forms';
</script>

<Card.Root class="mx-auto max-w-sm  border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-xl">Sign Up</Card.Title>
		<Card.Description>Enter your information to create an account</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<form action="?/register" method="POST" use:enhance>
				<div class="grid gap-4">
					{#if form?.invalid}
						<p class="error">password too short or email already in use</p>
					{/if}
					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="firstName">First name</Label>
							<Input id="firstName" name="firstName" placeholder="Max" required />
						</div>
						<div class="grid gap-2">
							<Label for="lastName">Last name</Label>
							<Input id="lastName" name="lastName" placeholder="Robinson" required />
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="username">Username</Label>
						<Input id="username" name="username" placeholder="username" required />
					</div>
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input id="email" type="email" name="email" placeholder="m@example.com" required />
					</div>
					<div class="grid gap-2">
						<Label for="password">Password</Label>
						<Input id="password" name="password" type="password" />
					</div>
					<Button type="submit" class="w-full">Create an account</Button>
				</div>
			</form>
			<form method="POST" action="/login/google" use:enhance>
				<Button variant="outline" class="w-full" type="submit">Register with Google</Button>
			</form>
			<form method="POST" action="/login/github" use:enhance>
				<Button variant="outline" class="w-full" type="submit">Register with Github</Button>
			</form>
		</div>
		<div class="mt-4 text-center text-sm">
			Already have an account?
			<a href="/login" class="underline"> Sign in </a>
		</div>
	</Card.Content>
</Card.Root>
