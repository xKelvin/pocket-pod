'use server';

import { createPodcastApi } from "@/services/podcasts/createPodcast";
import { CreatePodcast } from "@/types/podcasts";

export const createPodcastAction = async (data: CreatePodcast) => {
	return await createPodcastApi(data);
}