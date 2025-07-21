export type Podcast = {
	id: string;
	title: string;
	url: string;
	status: string;
	createdAt: Date;
};

export type CreatePodcast = Pick<Podcast, 'id' | 'url'>;