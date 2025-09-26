<script lang="ts">
	interface UserProfilePictureProps {
		profilePicture?: string | null;
		username?: string | null;
		size?: 'small' | 'medium' | 'large' | 'xl';
		class?: string;
		alt?: string;
	}

	const {
		profilePicture = null,
		username = null,
		size = 'medium',
		class: className = '',
		alt
	}: UserProfilePictureProps = $props();

	const sizeClasses = {
		small: 'w-8 h-8 text-xs',
		medium: 'w-12 h-12 text-base',
		large: 'w-32 h-32 text-2xl',
		xl: 'w-32 h-32 md:w-40 md:h-40 text-5xl md:text-6xl'
	};

	const backgroundColor = '#DC2626'; // red-600
	const initials = username?.charAt(0)?.toUpperCase() || '?';
	const altText = alt || `${username || 'User'}'s profile picture`;
</script>

{#if profilePicture}
	<div class="overflow-hidden rounded-lg {sizeClasses[size]} {className}">
		<img src={profilePicture} alt={altText} class="h-full w-full object-cover" />
	</div>
{:else}
	<div
		class="flex items-center justify-center rounded-lg font-bold text-white {sizeClasses[
			size
		]} {className}"
		style="background-color: {backgroundColor}"
	>
		{initials}
	</div>
{/if}
