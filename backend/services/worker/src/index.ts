import { createClient } from 'redis';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-jobs';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));

type JobEvent = {
	jobId: string;
	userId: string;
	url: string;
};

class PodcastWorker {
	private redisClient: ReturnType<typeof createClient>;

	constructor() {
		this.redisClient = createClient({ url: REDIS_URL });
	}

	async start() {
		try {
			await this.redisClient.connect();
			console.log('🔗 Connected to Redis');

			// Start processing jobs
			this.processJobs();

		} catch (error) {
			console.error('❌ Failed to connect to Redis:', error);
			process.exit(1);
		}
	}

	private async processJobs() {
		console.log('🔄 Worker started, listening for jobs...');

		await this.redisClient.xGroupCreate('podcast:jobs', 'workers', '0', { MKSTREAM: true })
			.catch(err => { if (!err.message.includes('BUSYGROUP')) throw err; });

		while (true) {
			const resp = await this.redisClient.xReadGroup(
				'workers',
				process.env.HOSTNAME!,
				// Deliver all messages from the stream with key 'podcast:jobs'
				// that are not yet delivered to any consumer,
				// and wait for up to 5 seconds for a message to be available
				{ key: 'podcast:jobs', id: '>' },
				{ COUNT: 1, BLOCK: 5000 }
			);

			if (!resp) continue;

			const messages = resp[0].messages;
			for (const m of messages) {
				const fields = m.message;
				try {
					await this.processJob(fields as JobEvent);
					await this.redisClient.xAck('podcast:jobs', 'workers', m.id);
					await this.redisClient.xDel('podcast:jobs', m.id);
				} catch (err) {
					console.error('Job failed', m.id, err);
				}
			}
		}
	}

	private async processJob(job: JobEvent) {
		console.log('🎵 Processing podcast job:', job);

		// Guard against malformed messages – both keys are required by DynamoDB
		if (!job.userId || !job.jobId) {
			throw new Error(`Malformed job event – missing userId or jobId: ${JSON.stringify(job)}`);
		}

		await docClient.send(createUpdateCommand(job.userId, job.jobId, 'processing'));
		// TODO: Implement the actual job processing:
		// 1. Fetch and clean HTML (Readability)
		// 2. Chunk text for TTS
		// 3. Generate audio with AWS Polly
		// 4. Concatenate audio with ffmpeg
		// 5. Upload to S3
		// 6. Update job status in DynamoDB

		// Simulate work
		await new Promise(resolve => setTimeout(resolve, 10000));
		await docClient.send(createUpdateCommand(job.userId, job.jobId, 'completed'));

		console.log('✅ Job completed:', job.jobId);
	}
}

const worker = new PodcastWorker();
worker.start().catch(console.error);

const createUpdateCommand = (userId: string, jobId: string, status: string) => {
	return new UpdateCommand({
		TableName: DYNAMODB_TABLE,
		Key: {
			userId,
			jobId,
		},
		UpdateExpression: 'SET #status = :status',
		ExpressionAttributeNames: {
			'#status': 'status',
		},
		ExpressionAttributeValues: {
			':status': status,
		},
	});
};