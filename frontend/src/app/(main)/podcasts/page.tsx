import { Metadata } from 'next';
import { fetchAllPodcastsApi } from '@/services/podcasts/fetchAllPodcasts';
import { PodcastsTable } from './components/PodcastsTable';

const PodcastsPage = () => {
	const podcasts = fetchAllPodcastsApi();

	return (
		<div className="container mx-auto flex flex-col overflow-y-auto">
			<div className="my-2 mt-20 flex flex-col rounded-lg bg-white px-4 py-3 shadow-md md:px-8 md:py-6">
				<PodcastsTable podcasts={podcasts} />
			</div>
		</div>
	);
};

export default PodcastsPage;

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Pocket Pod - ポッドキャスト一覧',
	};
} 