'server-only';
import { Podcast } from '@/types/podcasts';

/**
 * Create podcast - POST /podcasts
 */
export const deletePodcastApi = async (id: string): Promise<Podcast> => {
	const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/podcasts/${id}`;

	try {
		const res = await fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!res.ok) {
			throw new Error(`API error deleting podcast: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data as Podcast;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		const errorMessage = `An unexpected error occurred during deletePodcastApi execution: ${error}`;
		console.error(errorMessage);
		throw new Error(errorMessage);
	}
}; 