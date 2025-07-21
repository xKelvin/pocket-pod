'server-only';

/**
 * Fetch podcast url - GET /podcasts/:id/audio
 */
export const fetchPodcastUrlApi = async (id: string): Promise<{ podcastUrl: string }> => {
	const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/podcasts/${id}/audio`;

	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!res.ok) {
			throw new Error(`API error fetching podcast url: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data as { podcastUrl: string };
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		const errorMessage = `An unexpected error occurred during fetchPodcastUrlApi execution: ${error}`;
		console.error(errorMessage);
		throw new Error(errorMessage);
	}
}; 