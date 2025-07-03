import type { User } from './user';

export interface Comment {
  id: number;
  userId: number;
  tmdbId: number;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  userImageUrl?: string;
}
