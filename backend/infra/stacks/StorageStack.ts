import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends Stack {
	public readonly episodesBucket: Bucket;
	public readonly jobsTable: Table;

	constructor(scope: Construct, props?: StackProps) {
		super(scope, 'StorageStack', props);

		// Create S3 bucket for storing podcast episodes
		this.episodesBucket = new Bucket(this, 'EpisodesBucket', {
			bucketName: `pocket-pod-episodes-${this.account}-${this.region}`,
			versioned: false,
			publicReadAccess: false,
			removalPolicy: RemovalPolicy.DESTROY, // For development only
			autoDeleteObjects: true, // For development only
		});

		// Create DynamoDB table for job tracking
		this.jobsTable = new Table(this, 'JobsTable', {
			tableName: 'pocket-pod-jobs',
			partitionKey: { name: 'userId', type: AttributeType.STRING },
			sortKey: { name: 'jobId', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY, // For development only
		});

		// Add GSI for querying jobs by status
		this.jobsTable.addGlobalSecondaryIndex({
			indexName: 'StatusIndex',
			partitionKey: { name: 'status', type: AttributeType.STRING },
			sortKey: { name: 'createdAt', type: AttributeType.STRING },
		});
	}
} 