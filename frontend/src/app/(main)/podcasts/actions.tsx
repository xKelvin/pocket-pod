'use server';

import { createPodcastApi } from "@/services/podcasts/createPodcast";
import { deletePodcastApi } from "@/services/podcasts/deletePodcast";
import { fetchPodcastUrlApi } from "@/services/podcasts/fetchPodcastUrl";
import { CreatePodcast } from "@/types/podcasts";

export const createPodcastAction = async (data: CreatePodcast) => {
	return await createPodcastApi(data);
}

export const deletePodcastAction = async (id: string) => {
	return await deletePodcastApi(id);
}

export const fetchPodcastUrlAction = async (id: string) => {
	return await fetchPodcastUrlApi(id);
}