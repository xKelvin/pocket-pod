import type { Request, Response, NextFunction } from 'express';
import { podcastsSchema, podcastSchema, Podcast } from './validation/index.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import redisClient from '../lib/client.redis.js';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-podcasts';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));
const s3Client = new S3Client({ region: 'ap-northeast-1' });

export const getPodcasts = async (_req: Request, res: Response) => {
	// Retrieve all jobs from the DynamoDB table, where the partition key is the user id
	const command = new QueryCommand({
		TableName: DYNAMODB_TABLE,
		KeyConditionExpression: 'userId = :userId',
		ExpressionAttributeValues: {
			':userId': '123',
		},
	});

	const result = await docClient.send(command);

	const podcasts = podcastsSchema.parse(result.Items);

	res.json(podcasts);
};

export const getPodcastAudioLink = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		// Get the job from the DynamoDB table
		const command = new GetCommand({
			TableName: DYNAMODB_TABLE,
			Key: {
				userId: '123',
				id,
			},
		});

		const result = await docClient.send(command);

		if (!result.Item) {
			res.status(404).json({ message: 'Job not found' });
			return;
		}

		const audioKey = result.Item?.audioKey;

		if (audioKey) {
			const command = new GetObjectCommand({
				Bucket: process.env.S3_BUCKET!,
				Key: audioKey,
			});

			// Get the presigned url
			const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
			res.json({ podcastUrl: presignedUrl });
			return;
		}
	} catch (error) {
		next(error);
	}
};

export const createPodcast = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { url, id } = podcastSchema.parse(req.body);

		// Add the request to the DynamoDB table
		const podcastItem: Podcast = {
			id,
			url,
			status: 'pending',
			createdAt: new Date().toISOString(),
		};

		const command = new PutCommand({
			TableName: DYNAMODB_TABLE,
			Item: {
				userId: '123',
				...podcastItem,
			},
		});

		await docClient.send(command);

		await redisClient.xAdd('podcast:jobs', '*', {
			id,
			userId: '123',
			url,
		});

		res.status(201).json({ ...podcastItem });
	} catch (error) {
		next(error);
	}
};

export const deletePodcast = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		// Delete the job from the DynamoDB table
		const command = new DeleteCommand({
			TableName: DYNAMODB_TABLE,
			Key: {
				userId: '123',
				id,
			},
			ReturnValues: 'ALL_OLD',
		});

		const result = await docClient.send(command);
		const audioKey = result.Attributes?.audioKey;

		if (audioKey) {
			await s3Client.send(new DeleteObjectCommand({
				Bucket: process.env.S3_BUCKET!,
				Key: audioKey,
			}));
		}

		if (!result.Attributes) {
			res.status(404).json({ message: 'Job not found' });
			return;
		}

		res.json({ message: 'Job deleted', deleted: result.Attributes });
	} catch (error) {
		next(error);
	}
};