import type { Request, Response, NextFunction } from 'express';
import { jobsSchema, podcastSchema, Job } from './validation/index.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../lib/client.redis.js';

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'pocket-pod-jobs';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-northeast-1' }));

export const getJobs = async (_req: Request, res: Response) => {
	// Retrieve all jobs from the DynamoDB table, where the partition key is the user id
	const command = new QueryCommand({
		TableName: DYNAMODB_TABLE,
		KeyConditionExpression: 'userId = :userId',
		ExpressionAttributeValues: {
			':userId': '123',
		},
	});

	const result = await docClient.send(command);
	const jobs = jobsSchema.parse(result.Items);

	res.json(jobs);
};

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { url } = podcastSchema.parse(req.body);
		const jobId = uuidv4();

		// Add the request to the DynamoDB table
		const jobItem: Job = {
			id: jobId,
			userId: '123',
			url,
			status: 'pending',
		};

		const command = new PutCommand({
			TableName: DYNAMODB_TABLE,
			Item: {
				jobId: jobItem.id,
				...jobItem,
			},
		});

		await docClient.send(command);

		// TODO: Create a proper job event type.
		await redisClient.xAdd('podcast:jobs', '*', {
			jobId,
			userId: '123',
			url,
		});

		res.status(201).json({ jobId });
	} catch (error) {
		next(error);
	}
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		// Delete the job from the DynamoDB table
		const command = new DeleteCommand({
			TableName: DYNAMODB_TABLE,
			Key: {
				userId: '123',
				jobId: id,
			},
			ReturnValues: 'ALL_OLD',
		});

		const result = await docClient.send(command);

		if (!result.Attributes) {
			res.status(404).json({ message: 'Job not found' });
			return;
		}

		res.json({ message: 'Job deleted', deleted: result.Attributes });
	} catch (error) {
		next(error);
	}
};