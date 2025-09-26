<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Button } from '$lib/components/ui/button';

	let {
		currentProfilePicture = null,
		onFileSelected,
		onImageRemoved,
		imageKey = 0,
		username = '',
		selectedFile = null
	}: {
		currentProfilePicture?: string | null;
		onFileSelected?: (file: File) => void;
		onImageRemoved?: () => void;
		imageKey?: number;
		username?: string;
		selectedFile?: File | null;
	} = $props();

	let fileInput: HTMLInputElement;
	let error = $state('');
	let previewUrl = $state<string | null>(null);

	// Create preview URL when file is selected
	$effect(() => {
		if (selectedFile) {
			const url = URL.createObjectURL(selectedFile);
			previewUrl = url;
			
			// Cleanup URL when component is destroyed or file changes
			return () => {
				URL.revokeObjectURL(url);
			};
		} else {
			previewUrl = null;
		}
	});

	let imageUrl = $derived(previewUrl || currentProfilePicture);

	function triggerFileInput() {
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
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
		onFileSelected?.(file);
	}

	function handleRemoveImage() {
		if (fileInput) {
			fileInput.value = '';
		}
		onImageRemoved?.();
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
				/>
			{/key}
			
			<!-- Preview indicator for selected file -->
			{#if selectedFile}
				<div class="absolute top-1 right-1">
					<div class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
						{$_('profile.upload.preview')}
					</div>
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

	<!-- Upload/Change Button -->
	<div class="flex gap-2">
		<Button variant="outline" size="sm" onclick={triggerFileInput}>
			{selectedFile ? $_('profile.upload.change-file') : $_('profile.upload.choose-file')}
		</Button>
		
		{#if selectedFile || (currentProfilePicture && !selectedFile)}
			<Button variant="outline" size="sm" onclick={handleRemoveImage}>
				{$_('profile.upload.remove')}
			</Button>
		{/if}
	</div>

	<!-- File info for selected file -->
	{#if selectedFile}
		<div class="text-center text-sm text-gray-400">
			<p>{selectedFile.name}</p>
			<p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
		</div>
	{/if}

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
