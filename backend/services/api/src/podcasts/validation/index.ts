import { z } from 'zod';
import { podcastStatus } from '../podcast.types.js';

export const podcastSchema = z.object({
	id: z.uuid(),
	userId: z.string(),
	title: z.string().default('pending...').optional(),
	url: z.string(),
	status: z.enum(podcastStatus),
	createdAt: z.string().default(new Date().toISOString()).optional(),
});

export const podcastsSchema = z.array(podcastSchema);

export type Podcast = z.infer<typeof podcastSchema>;