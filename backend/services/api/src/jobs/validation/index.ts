import { z } from 'zod';
import { jobStatus } from '../job.types.js';

export const podcastSchema = z.object({
	url: z.url(),
});

export const jobSchema = z.object({
	id: z.uuid(),
	userId: z.string(),
	url: z.string(),
	status: z.enum(jobStatus),
	createdAt: z.string().default(new Date().toISOString()).optional(),
});

export const jobsSchema = z.array(jobSchema);

export type Podcast = z.infer<typeof podcastSchema>;
export type Job = z.infer<typeof jobSchema>;