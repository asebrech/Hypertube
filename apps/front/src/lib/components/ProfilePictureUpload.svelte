<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { uploadProfilePicture } from '$lib/services/api';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	let {
		currentProfilePicture = null,
		onUploadSuccess,
		onImageRemoved,
		imageKey = 0,
		username = ''
	}: {
		currentProfilePicture?: string | null;
		onUploadSuccess?: (data: { profilePicture: string; message: string }) => void;
		onImageRemoved?: () => void;
		imageKey?: number;
		username?: string;
	} = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let isImageLoading = $state(false);
	let error = $state('');

	let imageUrl = $derived(currentProfilePicture);

	$effect(() => {
		if (currentProfilePicture) {
			isImageLoading = true;
		}
	});

	function triggerFileInput() {
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			error = $_('profile.upload.error-image-type');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			error = $_('profile.upload.error-file-size');
			return;
		}

		error = '';
		isUploading = true;

		try {
			const token = $page.data.user?.token || $page.data.token;

			if (!token) {
				error = $_('profile.upload.error-login-required');
				return;
			}

			const response = await uploadProfilePicture(file, token);

			console.log('Upload successful:', response);

			onUploadSuccess?.({
				profilePicture: response.profilePicture,
				message: response.message
			});
		} catch (err: any) {
			console.error('Upload error:', err);
			error = err.response?.data?.message || $_('profile.upload.error-upload-failed');
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="flex flex-col items-center space-y-4">
	<!-- Profile Picture Display -->
	<div class="relative h-32 w-32 overflow-hidden rounded-lg">
		{#if imageUrl}
			{#key `${imageUrl}-${imageKey}`}
				<img
					src={imageUrl}
					alt="Profile"
					class="h-full w-full object-cover"
					onload={() => {
						isImageLoading = false;
					}}
					onerror={() => {
						isImageLoading = false;
					}}
				/>
			{/key}

			<!-- Image Loading Overlay -->
			{#if isImageLoading}
				<div class="absolute inset-0 flex items-center justify-center bg-gray-200">
					<div
						class="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
					></div>
				</div>
			{/if}
		{:else}
			<div
				class="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800"
			>
				<span class="text-5xl font-bold text-white">
					{username?.charAt(0)?.toUpperCase() || '?'}
				</span>
			</div>
		{/if}
	</div>

	<!-- Upload Button -->
	<Button variant="outline" size="sm" onclick={triggerFileInput} disabled={isUploading}>
		{isUploading ? $_('profile.upload.uploading') : $_('profile.upload.choose-file')}
	</Button>

	<!-- Error Message -->
	{#if error}
		<div class="max-w-xs text-center text-sm text-red-500">
			{error}
		</div>
	{/if}

	<!-- Hidden File Input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileChange}
	/>
</div>
