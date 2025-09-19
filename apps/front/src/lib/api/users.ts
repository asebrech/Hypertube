import { browser } from '$app/environment';

export type PublicUser = {
	id: number;
	username?: string;
	firstName?: string;
	lastName?: string;
};

export type CurrentUser = PublicUser & {
	email: string;
	createdAt: string;
};

/**
 * Update user profile data
 */
export async function updateUserProfile(
	userId: number,
	profileData: { username?: string; firstName?: string; lastName?: string },
	token: string
) {
	if (!browser) return;

	const response = await fetch(`http://localhost:3333/users/${userId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(profileData)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to update profile');
	}

	return await response.json();
}

/**
 * Get user display name (firstName lastName or username or fallback)
 */
export function getUserDisplayName(user: PublicUser): string {
	if (user.firstName && user.lastName) {
		return `${user.firstName} ${user.lastName}`;
	}
	if (user.firstName) {
		return user.firstName;
	}
	if (user.username) {
		return user.username;
	}
	return `User ${user.id}`;
}
