import { Router } from 'express';
import {
	createJob,
	getJobs,
	deleteJob,
} from './job.controller.js';

const router = Router();

router.get('/', getJobs);
router.post('/', createJob);
router.delete('/:id', deleteJob);

export default router;