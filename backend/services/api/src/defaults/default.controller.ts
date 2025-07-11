import { Request, Response } from 'express';

export const healthCheck = (_req: Request, res: Response) => {
	res.json({ status: 'healthy', service: 'pocket-pod-api' });
};

export const root = (_req: Request, res: Response) => {
	res.json({
		message: '👋 Pocket-Pod API up!',
		version: '0.1.0',
		endpoints: ['/health', '/']
	});
};