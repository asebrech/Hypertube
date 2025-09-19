<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { uploadProfilePicture } from '$lib/services/api';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	let { 
		currentProfilePicture = null, 
		onUploadSuccess,
		onImageRemoved
	}: { 
		currentProfilePicture?: string | null; 
		onUploadSuccess?: (data: { profilePicture: string; message: string }) => void;
		onImageRemoved?: () => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let isImageLoading = $state(false);
	let error = $state('');

	// Simple reactive image URL - no cache busting needed
	let imageUrl = $derived(currentProfilePicture);

	// Update loading state when profile picture changes
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

		// Basic validation
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file';
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			error = 'File must be less than 5MB';
			return;
		}

		error = '';
		isUploading = true;

		try {
			const token = $page.data.user?.token || $page.data.token;
			
			if (!token) {
				error = 'You must be logged in to upload a profile picture';
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
			error = err.response?.data?.message || 'Failed to upload profile picture';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="flex flex-col items-center space-y-4">
	<!-- Profile Picture Display -->
	<div class="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 relative">
		{#if imageUrl}
			<img 
				src={imageUrl}
				alt="Profile" 
				class="w-full h-full object-cover"
				onload={() => {
					isImageLoading = false;
					console.log('✅ Image loaded:', imageUrl);
				}}
				onerror={() => {
					isImageLoading = false;
					console.error('❌ Image failed to load:', imageUrl);
				}}
			/>
			
			<!-- Image Loading Overlay -->
			{#if isImageLoading}
				<div class="absolute inset-0 bg-gray-200 flex items-center justify-center">
					<div class="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
				</div>
			{/if}
		{:else}
			<div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
				<svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				<span class="text-xs text-center">No Image</span>
			</div>
		{/if}
	</div>

	<!-- Upload Button -->
	<Button 
		variant="outline" 
		size="sm" 
		onclick={triggerFileInput} 
		disabled={isUploading}
	>
		{isUploading ? 'Uploading...' : $_('profile.upload.choose-file')}
	</Button>

	<!-- Error Message -->
	{#if error}
		<div class="text-red-500 text-sm text-center max-w-xs">
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