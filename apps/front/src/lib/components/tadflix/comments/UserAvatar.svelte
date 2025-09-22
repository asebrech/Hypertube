<script lang="ts">
	interface UserAvatarProps {
		username: string;
		size?: 'small' | 'medium' | 'large';
		class?: string;
		clickable?: boolean;
		onclick?: () => void;
	}

	const {
		username,
		size = 'medium',
		class: className = '',
		clickable = false,
		onclick
	}: UserAvatarProps = $props();

	// Generate avatar based on username initials
	const getInitials = (name: string): string => {
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	// Use consistent red background like other components
	const backgroundColor = '#DC2626'; // red-600

	const sizeClasses = {
		small: 'w-8 h-8 text-xs',
		medium: 'w-12 h-12 text-sm',
		large: 'w-16 h-16 text-base'
	};

	const avatarStyle = $derived(`background-color: ${backgroundColor}`);
	const initials = $derived(getInitials(username));
</script>

{#if clickable}
	<button
		{onclick}
		class="flex items-center justify-center rounded-md font-medium text-white transition-opacity hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none {sizeClasses[
			size
		]} {className}"
		style={avatarStyle}
		aria-label={`View ${username}'s profile`}
	>
		{initials}
	</button>
{:else}
	<div
		class="flex items-center justify-center rounded-md font-medium text-white {sizeClasses[
			size
		]} {className}"
		style={avatarStyle}
	>
		{initials}
	</div>
{/if}
