'use client';

import { Button } from '@/components/ui/button';
import { fetchPodcastUrlAction } from '../actions';

interface PodcastPlayButtonProps {
	podcastId: string;
}

export default function PodcastPlayButton({ podcastId }: PodcastPlayButtonProps) {

	const handlePlay = async () => {
		const url = await fetchPodcastUrlAction(podcastId);
		window.open(url.podcastUrl, '_blank');
	}

	return (
		<Button variant="outline" onClick={handlePlay}>
			再生
		</Button>
	);
}