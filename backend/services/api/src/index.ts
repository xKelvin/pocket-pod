import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
	res.json({ status: 'healthy', service: 'pocket-pod-api' });
});

// Root endpoint
app.get('/', (_req, res) => {
	res.json({
		message: '👋 Pocket-Pod API up!',
		version: '0.1.0',
		endpoints: ['/health', '/']
	});
});

app.listen(PORT, () => {
	console.log(`🚀 API listening on port ${PORT}`);
}); 