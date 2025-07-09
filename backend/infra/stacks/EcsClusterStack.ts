import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerInsights } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface EcsClusterStackProps extends StackProps {
	vpc: IVpc;
}

export class EcsClusterStack extends Stack {
	public readonly cluster: Cluster;
	public readonly taskExecutionRole: Role;
	public readonly apiLogGroup: LogGroup;
	public readonly workerLogGroup: LogGroup;

	constructor(scope: Construct, props: EcsClusterStackProps) {
		super(scope, 'EcsClusterStack', props);

		const { vpc } = props;

		// Create ECS Cluster
		this.cluster = new Cluster(this, 'PocketPodCluster', {
			vpc: vpc,
			clusterName: 'pocket-pod-cluster',
			// Enable Container Insights for monitoring
			containerInsightsV2: ContainerInsights.ENHANCED,
		});

		// Create task execution role
		this.taskExecutionRole = new Role(this, 'TaskExecutionRole', {
			assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
			],
		});

		// Create log groups for services
		this.apiLogGroup = new LogGroup(this, 'ApiLogGroup', {
			logGroupName: '/ecs/pocket-pod-api',
			removalPolicy: RemovalPolicy.DESTROY,
		});

		this.workerLogGroup = new LogGroup(this, 'WorkerLogGroup', {
			logGroupName: '/ecs/pocket-pod-worker',
			removalPolicy: RemovalPolicy.DESTROY,
		});
	}
} 