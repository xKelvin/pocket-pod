#!/usr/bin/env node
import 'source-map-support/register';
import { App, StackProps } from 'aws-cdk-lib';
import { VpcStack } from './stacks/VpcStack';
import { StorageStack } from './stacks/StorageStack';
import { CacheStack } from './stacks/CacheStack';
import { EcsClusterStack } from './stacks/EcsClusterStack';
import { LoadBalancerStack } from './stacks/LoadBalancerStack';
import { ApiServiceStack } from './stacks/ApiServiceStack';
import { WorkerServiceStack } from './stacks/WorkerServiceStack';

const app = new App();
const region = 'ap-northeast-1';

const defaultProps: StackProps = {
	env: {
		region,
		account: process.env.CDK_DEFAULT_ACCOUNT!,
	},
};

// (no dependencies)
const vpcStack = new VpcStack(app, defaultProps);

// (no dependencies on our stacks)
const storageStack = new StorageStack(app, defaultProps);

// (depends on VPC)
const cacheStack = new CacheStack(app, {
	...defaultProps,
	vpc: vpcStack.vpc,
});

// (depends on VPC)
const clusterStack = new EcsClusterStack(app, {
	...defaultProps,
	vpc: vpcStack.vpc,
});

// (depends on VPC)
const lbStack = new LoadBalancerStack(app, {
	...defaultProps,
	vpc: vpcStack.vpc,
});

// (depends on network, storage, cache, cluster, and lb)
new ApiServiceStack(app, {
	...defaultProps,
	cluster: clusterStack.cluster,
	podcastsTable: storageStack.podcastsTable,
	redisCluster: cacheStack.redisCluster,
	taskExecutionRole: clusterStack.taskExecutionRole,
	apiTargetGroup: lbStack.apiTargetGroup,
	apiLogGroup: clusterStack.apiLogGroup,
	s3Bucket: storageStack.podcastsBucket,
});

// (depends on network, storage, cache, and cluster)
new WorkerServiceStack(app, {
	...defaultProps,
	cluster: clusterStack.cluster,
	podcastsTable: storageStack.podcastsTable,
	podcastsBucket: storageStack.podcastsBucket,
	redisCluster: cacheStack.redisCluster,
	taskExecutionRole: clusterStack.taskExecutionRole,
	workerLogGroup: clusterStack.workerLogGroup,
});

app.synth();
