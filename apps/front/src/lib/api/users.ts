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
