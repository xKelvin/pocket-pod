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
	Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { CfnReplicationGroup } from 'aws-cdk-lib/aws-elasticache';
import {
	IApplicationTargetGroup,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { IRole, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiServiceStackProps extends StackProps {
	cluster: ICluster;
	jobsTable: ITable;
	redisCluster: CfnReplicationGroup;
	taskExecutionRole: IRole;
	apiTargetGroup: IApplicationTargetGroup;
	apiLogGroup: ILogGroup;
}

export class ApiServiceStack extends Stack {
	constructor(scope: Construct, props: ApiServiceStackProps) {
		super(scope, 'ApiServiceStack', props);

		const { cluster, jobsTable, redisCluster, taskExecutionRole, apiTargetGroup, apiLogGroup } = props;

		// Create task role for API service
		const apiTaskRole = new Role(this, 'ApiTaskRole', {
			assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
		});

		// Grant API service permissions to DynamoDB
		jobsTable.grantReadWriteData(apiTaskRole);

		// Create API task definition
		const apiTaskDefinition = new FargateTaskDefinition(this, 'ApiTaskDefinition', {
			memoryLimitMiB: 512,
			cpu: 256,
			executionRole: taskExecutionRole,
			taskRole: apiTaskRole,
			// This has to be set explicitly to avoid the default of x86_64, which introduces unexpected errors when
			// comparing the container running locally with the container running in ECS.
			// https://stackoverflow.com/questions/74705475/aws-ecs-exec-usr-local-bin-docker-entrypoint-sh-exec-format-error
			runtimePlatform: {
				cpuArchitecture: CpuArchitecture.ARM64,
				operatingSystemFamily: OperatingSystemFamily.LINUX,
			},
		});

		// Add API container to task definition
		const apiContainer = apiTaskDefinition.addContainer('ApiContainer', {
			image: ContainerImage.fromAsset('./services/api'),
			logging: LogDrivers.awsLogs({
				streamPrefix: 'api',
				logGroup: apiLogGroup,
			}),
			environment: {
				NODE_ENV: 'production',
				PORT: '3000',
				DYNAMODB_TABLE: jobsTable.tableName,
				REDIS_URL: `redis://${redisCluster.attrPrimaryEndPointAddress}:6379`,
			},
		});

		apiContainer.addPortMappings({
			containerPort: 3000,
			protocol: Protocol.TCP,
		});

		// Create API service
		const apiService = new FargateService(this, 'ApiService', {
			cluster,
			taskDefinition: apiTaskDefinition,
			desiredCount: 1,
			assignPublicIp: false,
			vpcSubnets: {
				subnetType: SubnetType.PRIVATE_WITH_EGRESS,
			},
			minHealthyPercent: 100,
			serviceName: 'pocket-pod-api',
		});

		// Attach API service to load balancer
		apiService.attachToApplicationTargetGroup(apiTargetGroup);
	}
} 