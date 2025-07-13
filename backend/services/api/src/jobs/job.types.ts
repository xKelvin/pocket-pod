export const jobStatus = ['pending', 'processing', 'completed', 'failed'] as const;
export type JobStatus = (typeof jobStatus)[number];
