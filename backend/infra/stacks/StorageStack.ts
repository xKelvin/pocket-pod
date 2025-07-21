import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends Stack {
	public readonly podcastsBucket: Bucket;
	public readonly podcastsTable: Table;

	constructor(scope: Construct, props?: StackProps) {
		super(scope, 'StorageStack', props);

		// Create S3 bucket for storing podcast episodes
		this.podcastsBucket = new Bucket(this, 'PodcastsBucket', {
			bucketName: `pocket-pod-podcasts-${this.account}-${this.region}`,
			versioned: false,
			publicReadAccess: false,
			removalPolicy: RemovalPolicy.DESTROY, // For development only
			autoDeleteObjects: true, // For development only
		});

		// Create DynamoDB table for job tracking
		this.podcastsTable = new Table(this, 'PodcastsTable', {
			tableName: 'pocket-pod-podcasts',
			partitionKey: { name: 'userId', type: AttributeType.STRING },
			sortKey: { name: 'podcastId', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY, // For development only
		});

		// Add GSI for querying jobs by status
		this.podcastsTable.addGlobalSecondaryIndex({
			indexName: 'StatusIndex',
			partitionKey: { name: 'status', type: AttributeType.STRING },
			sortKey: { name: 'createdAt', type: AttributeType.STRING },
		});
	}
} 