'server-only';
import { Podcast } from '@/types/podcasts';

/**
 * Fetch all podcasts - GET /podcasts
 */
export const fetchAllPodcastsApi = async (): Promise<Podcast[]> => {
	const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/podcasts`;

	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!res.ok) {
			throw new Error(`API error fetching all podcasts: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data as Podcast[];
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		const errorMessage = `An unexpected error occurred during fetchAllPodcastsApi execution: ${error}`;
		console.error(errorMessage);
		throw new Error(errorMessage);
	}
}; 