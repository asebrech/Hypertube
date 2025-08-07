<script lang="ts">
	interface UserAvatarProps {
		username: string;
		size?: 'small' | 'medium' | 'large';
		class?: string;
	}

	const { username, size = 'medium', class: className = '' }: UserAvatarProps = $props();

	// Generate avatar based on username initials
	const getInitials = (name: string): string => {
		return name
			.split(' ')
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	// Generate a consistent color based on username
	const getBackgroundColor = (name: string): string => {
		const colors = [
			'#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
			'#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
			'#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
			'#F4511E', '#6D4C41', '#757575', '#546E7A'
		];
		
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % colors.length;
		return colors[index];
	};

	const sizeClasses = {
		small: 'w-8 h-8 text-xs',
		medium: 'w-12 h-12 text-sm',
		large: 'w-16 h-16 text-base'
	};

	const avatarStyle = $derived(`background-color: ${getBackgroundColor(username)}`);
	const initials = $derived(getInitials(username));
</script>

<div 
	class="rounded-md flex items-center justify-center text-white font-medium {sizeClasses[size]} {className}"
	style={avatarStyle}
>
	{initials}
</div>
