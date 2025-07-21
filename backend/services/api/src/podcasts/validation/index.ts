import { z } from 'zod';
import { podcastStatus } from '../podcast.types.js';

export const podcastSchema = z.object({
	id: z.uuid(),
	title: z.string().default('pending...').optional(),
	url: z.string(),
	status: z.enum(podcastStatus).default('pending').optional(),
	createdAt: z.string().optional(),
});

export const podcastsSchema = z.array(podcastSchema);

export type Podcast = z.infer<typeof podcastSchema>;