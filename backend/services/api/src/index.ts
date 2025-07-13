import express from 'express';
import jobRoutes from './jobs/job.routes.js';
import defaultRoutes from './defaults/default.routes.js';
import { errorHandler } from './middlewares/error.handler.js';
import redisClient from './lib/client.redis.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/jobs', jobRoutes);
app.use('/', defaultRoutes);

app.use(errorHandler);

await redisClient.connect();

app.listen(PORT, () => {
	console.log(`🚀 API listening on port ${PORT}`);
}); 