'use client';

import { Button } from '@/components/ui/button';

interface PodcastDeleteButtonProps {
	onClick: () => void;
}

export default function PodcastDeleteButton({ onClick }: PodcastDeleteButtonProps) {
	return (
		<Button variant="destructive" onClick={onClick}>
			削除
		</Button>
	);
}