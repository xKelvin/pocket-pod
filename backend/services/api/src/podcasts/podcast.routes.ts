import { Router } from 'express';
import {
	createPodcast,
	getPodcasts,
	deletePodcast,
} from './podcast.controller.js';

const router = Router();

router.get('/', getPodcasts);
router.post('/', createPodcast);
router.delete('/:id', deletePodcast);

export default router;