'server-only';
import { CreatePodcast, Podcast } from '@/types/podcasts';

/**
 * Create podcast - POST /podcasts
 */
export const createPodcastApi = async (requestData: CreatePodcast): Promise<Podcast> => {
	const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/podcasts`;

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestData),
		});

		if (!res.ok) {
			throw new Error(`API error creating podcast: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data as Podcast;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		const errorMessage = `An unexpected error occurred during createPodcastApi execution: ${error}`;
		console.error(errorMessage);
		throw new Error(errorMessage);
	}
}; 