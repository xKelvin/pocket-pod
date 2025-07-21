export const podcastStatus = ['pending', 'processing', 'completed', 'failed'] as const;
export type PodcastStatus = (typeof podcastStatus)[number];
