import { Router } from 'express';
import {
	createPodcast,
	getPodcasts,
	deletePodcast,
	getPodcastAudioLink,
} from './podcast.controller.js';

const router = Router();

router.get('/', getPodcasts);
router.post('/', createPodcast);
router.delete('/:id', deletePodcast);
router.get('/:id/audio', getPodcastAudioLink);

export default router;