import type { Request, Response, NextFunction } from 'express';
import { podcastsSchema, podcastSchema, Podcast } from './validation/index.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import redisClient from '../lib/client.redis.js';

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-podcasts';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));

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

export const createPodcast = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { url, id } = podcastSchema.parse(req.body);

		// Add the request to the DynamoDB table
		const podcastItem: Podcast = {
			id,
			url,
			status: 'pending',
		};

		const command = new PutCommand({
			TableName: DYNAMODB_TABLE,
			Item: {
				podcastId: podcastItem.id,
				userId: '123',
				...podcastItem,
			},
		});

		await docClient.send(command);

		// TODO: Create a proper job event type.
		await redisClient.xAdd('podcast:jobs', '*', {
			podcastId: id,
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
				podcastId: id,
			},
			ReturnValues: 'ALL_OLD',
		});

		const result = await docClient.send(command);

		// TODO: Delete the job from the Redis stream
		// TODO: Delete the produced audio from S3

		if (!result.Attributes) {
			res.status(404).json({ message: 'Job not found' });
			return;
		}

		res.json({ message: 'Job deleted', deleted: result.Attributes });
	} catch (error) {
		next(error);
	}
};