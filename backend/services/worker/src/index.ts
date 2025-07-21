import { createClient } from 'redis';
import { Engine, LanguageCode, OutputFormat, PollyClient, StartSpeechSynthesisTaskCommand, StartSpeechSynthesisTaskCommandInput, VoiceId } from '@aws-sdk/client-polly';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import puppeteer from 'puppeteer';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-jobs';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));
const pollyClient = new PollyClient({ region: 'ap-northeast-1' });

type JobEvent = {
	jobId: string;
	userId: string;
	url: string;
};

// Simplified return type for xReadGroup when reading from a single stream
type StreamMessage = { id: string; message: Record<string, string> };
type StreamResp = Array<{ name: string; messages: StreamMessage[] }>;

class PodcastWorker {
	private redisClient: ReturnType<typeof createClient>;
	private browser: puppeteer.Browser | null = null;

	constructor() {
		this.redisClient = createClient({ url: REDIS_URL });
	}

	async start() {
		try {
			await this.redisClient.connect();

			// Launch a single shared browser instance for this worker
			this.browser = await puppeteer.launch({
				headless: true,
				executablePath: process.env.CHROME_BIN || '/usr/bin/chromium',
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});

			// Start processing jobs (do not await – keep listening forever)
			this.processJobs();

		} catch (error) {
			console.error('❌ Failed to connect to Redis:', error);
			process.exit(1);
		}
	}

	private async processJobs() {
		console.log('Worker started, listening for jobs...');

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

			// If no messages were returned, continue waiting
			if (!resp || !Array.isArray(resp) || resp.length === 0) continue;

			// xReadGroup returns an array of streams – we only listen to one
			const streamResp = resp as StreamResp;
			const messages = streamResp[0].messages;
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
		// Guard against malformed messages – both keys are required by DynamoDB
		if (!job.userId || !job.jobId) {
			throw new Error(`Malformed job event – missing userId or jobId: ${JSON.stringify(job)}`);
		}

		await docClient.send(createUpdateCommand(job.userId, job.jobId, 'processing'));

		if (!this.browser) {
			throw new Error('Browser not initialized');
		}

		const page = await this.browser.newPage();
		await page.goto(job.url, { waitUntil: 'domcontentloaded' });
		const html = await page.content();
		await page.close();

		// Fetch with Puppeteer and clean HTML (Readability)
		const doc = new JSDOM(html, { url: job.url });
		const reader = new Readability(doc.window.document);
		const article = reader.parse();

		const title = article?.title;
		const content = article?.textContent;

		if (!content || !title) {
			throw new Error('No content found');
		}

		// Chunk text for TTS
		const chunks = [
			title,
			...content.split('\n').map(line => line.trim()).filter(line => line.length > 0),
		].filter(chunk => chunk !== undefined);

		// Generate audio with AWS Polly
		const params: StartSpeechSynthesisTaskCommandInput = {
			Text: chunks.join('\n'),
			OutputFormat: OutputFormat.MP3,
			VoiceId: VoiceId.Ruth,
			Engine: Engine.NEURAL,
			LanguageCode: LanguageCode.en_US,
			OutputS3BucketName: process.env.S3_BUCKET!,
			OutputS3KeyPrefix: `${job.userId}/${job.jobId}.mp3`,
		};

		await pollyClient.send(new StartSpeechSynthesisTaskCommand(params));

		// Update job status in DynamoDB
		await docClient.send(createUpdateCommand(job.userId, job.jobId, 'completed'));
		console.log('Job completed:', job.jobId);
	}

	/** Gracefully close shared resources when the process exits */
	async shutdown() {
		try {
			await Promise.all([
				this.browser?.close(),
				this.redisClient.quit(),
			]);
			// eslint-disable-next-line no-empty
		} catch { }
	}
}

const worker = new PodcastWorker();
worker.start().catch(console.error);

// Handle shutdown signals to close resources gracefully inside the container
process.on('SIGTERM', () => worker.shutdown().finally(() => process.exit(0)));
process.on('SIGINT', () => worker.shutdown().finally(() => process.exit(0)));

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