import { Router } from 'express';
import {
	healthCheck,
	root,
} from './default.controller.js';

const defaultRoutes = Router();

defaultRoutes.get('/health', healthCheck);
defaultRoutes.get('/', root);

export default defaultRoutes;