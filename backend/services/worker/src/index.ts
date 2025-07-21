import { createClient } from 'redis';
import { Engine, LanguageCode, OutputFormat, PollyClient, StartSpeechSynthesisTaskCommand, StartSpeechSynthesisTaskCommandInput, VoiceId } from '@aws-sdk/client-polly';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import puppeteer from 'puppeteer';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-podcasts';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));
const pollyClient = new PollyClient({ region: 'ap-northeast-1' });
const REDIS_STREAM_KEY = 'podcast:jobs';

type PodcastEvent = {
	id: string;
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

			// Start processing podcasts (do not await – keep listening forever)
			this.processPodcasts();

		} catch (error) {
			console.error('❌ Failed to connect to Redis:', error);
			process.exit(1);
		}
	}

	private async processPodcasts() {
		console.log('Worker started, listening for podcasts...');

		await this.redisClient.xGroupCreate(REDIS_STREAM_KEY, 'workers', '0', { MKSTREAM: true })
			.catch(err => { if (!err.message.includes('BUSYGROUP')) throw err; });

		while (true) {
			const resp = await this.redisClient.xReadGroup(
				'workers',
				process.env.HOSTNAME!,
				// Deliver all messages from the stream with key 'podcast:jobs'
				// that are not yet delivered to any consumer,
				// and wait for up to 5 seconds for a message to be available
				{ key: REDIS_STREAM_KEY, id: '>' },
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
					await this.processPodcast(fields as PodcastEvent);
					await this.redisClient.xAck(REDIS_STREAM_KEY, 'workers', m.id);
					await this.redisClient.xDel(REDIS_STREAM_KEY, m.id);
				} catch (err) {
					console.error('Podcast failed', m.id, err);
				}
			}
		}
	}

	private async processPodcast(podcast: PodcastEvent) {
		// Guard against malformed messages – both keys are required by DynamoDB
		if (!podcast.userId || !podcast.id) {
			throw new Error(`Malformed podcast event – missing userId or id: ${JSON.stringify(podcast)}`);
		}

		await docClient.send(createUpdateCommand(podcast.userId, podcast.id, 'processing', 'processing', ''));

		if (!this.browser) {
			throw new Error('Browser not initialized');
		}

		const page = await this.browser.newPage();
		await page.goto(podcast.url, { waitUntil: 'domcontentloaded' });
		const html = await page.content();
		await page.close();

		// Fetch with Puppeteer and clean HTML (Readability)
		const doc = new JSDOM(html, { url: podcast.url });
		const reader = new Readability(doc.window.document);
		const article = reader.parse();

		const title = article?.title;
		const content = article?.textContent;

		if (!content || !title) {
			throw new Error('Could not parse article.');
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
			OutputS3KeyPrefix: `${podcast.userId}/`,
		};

		const result = await pollyClient.send(new StartSpeechSynthesisTaskCommand(params));
		const audioKey = `${podcast.userId}/.${result.SynthesisTask?.TaskId}.mp3`;

		if (!audioKey) {
			throw new Error('Could not generate audio.');
		}

		// Update podcast status in DynamoDB
		await docClient.send(createUpdateCommand(podcast.userId, podcast.id, 'completed', title, audioKey));
		console.log('Podcast completed:', podcast.id);
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

const createUpdateCommand = (userId: string, id: string, status: string, title: string, audioKey: string) => {
	return new UpdateCommand({
		TableName: DYNAMODB_TABLE,
		Key: {
			userId,
			id,
		},
		UpdateExpression: 'SET #status = :status, #title = :title, #audioKey = :audioKey',
		ExpressionAttributeNames: {
			'#status': 'status',
			'#title': 'title',
			'#audioKey': 'audioKey',
		},
		ExpressionAttributeValues: {
			':status': status,
			':title': title,
			':audioKey': audioKey,
		},
	});
};