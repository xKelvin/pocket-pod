import { Stack, StackProps } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
	ContainerImage,
	CpuArchitecture,
	FargateService,
	FargateTaskDefinition,
	ICluster,
	LogDrivers,
	OperatingSystemFamily,
} from 'aws-cdk-lib/aws-ecs';
import { CfnReplicationGroup } from 'aws-cdk-lib/aws-elasticache';
import { IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface WorkerServiceStackProps extends StackProps {
	cluster: ICluster;
	podcastsTable: ITable;
	podcastsBucket: IBucket;
	redisCluster: CfnReplicationGroup;
	taskExecutionRole: IRole;
	workerLogGroup: ILogGroup;
}

export class WorkerServiceStack extends Stack {
	constructor(scope: Construct, props: WorkerServiceStackProps) {
		super(scope, 'WorkerServiceStack', props);

		const {
			cluster,
			podcastsTable,
			podcastsBucket,
			redisCluster,
			taskExecutionRole,
			workerLogGroup,
		} = props;

		// Create task role for worker service
		const workerTaskRole = new Role(this, 'WorkerTaskRole', {
			assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
		});

		// Grant worker service permissions
		podcastsTable.grantReadWriteData(workerTaskRole);
		podcastsBucket.grantReadWrite(workerTaskRole);

		// Grant Polly permissions for TTS
		workerTaskRole.addToPrincipalPolicy(
			new PolicyStatement({
				actions: [
					'polly:StartSpeechSynthesisTask',
					'polly:GetSpeechSynthesisTask',
					'polly:ListSpeechSynthesisTasks'
				],
				resources: ['*'],
			})
		);

		// Create worker task definition
		const workerTaskDefinition = new FargateTaskDefinition(this, 'WorkerTaskDefinition', {
			memoryLimitMiB: 2048,
			cpu: 1024,
			executionRole: taskExecutionRole,
			taskRole: workerTaskRole,
			// This has to be set explicitly to avoid the default of x86_64, which introduces unexpected errors when
			// comparing the container running locally with the container running in ECS.
			// https://stackoverflow.com/questions/74705475/aws-ecs-exec-usr-local-bin-docker-entrypoint-sh-exec-format-error
			runtimePlatform: {
				cpuArchitecture: CpuArchitecture.ARM64,
				operatingSystemFamily: OperatingSystemFamily.LINUX,
			},
		});

		// Add worker container to task definition
		workerTaskDefinition.addContainer('WorkerContainer', {
			image: ContainerImage.fromAsset('./services/worker'),
			logging: LogDrivers.awsLogs({
				streamPrefix: 'worker',
				logGroup: workerLogGroup,
			}),
			environment: {
				NODE_ENV: 'production',
				DYNAMODB_TABLE: podcastsTable.tableName,
				S3_BUCKET: podcastsBucket.bucketName,
				REDIS_URL: `redis://${redisCluster.attrPrimaryEndPointAddress}:6379`,
				AWS_REGION: this.region,
			},
		});

		// Create worker service
		new FargateService(this, 'WorkerService', {
			cluster: cluster,
			taskDefinition: workerTaskDefinition,
			// Scale to 1 initially, will scale up based on custom metrics.
			// https://aws.amazon.com/jp/blogs/containers/autoscaling-amazon-ecs-services-based-on-custom-metrics-with-application-auto-scaling/
			desiredCount: 1,
			assignPublicIp: false,
			vpcSubnets: {
				subnetType: SubnetType.PRIVATE_WITH_EGRESS,
			},
			minHealthyPercent: 100,
			serviceName: 'pocket-pod-worker',
		});
	}
} 