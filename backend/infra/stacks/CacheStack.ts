import { Stack, StackProps } from 'aws-cdk-lib';
import { IVpc, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { CfnReplicationGroup, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface CacheStackProps extends StackProps {
	vpc: IVpc;
}

export class CacheStack extends Stack {
	public readonly redisCluster: CfnReplicationGroup;
	public readonly redisSecurityGroup: SecurityGroup;

	constructor(scope: Construct, props: CacheStackProps) {
		super(scope, 'CacheStack', props);

		const { vpc } = props;

		// Create Redis cluster for job queue
		const redisSubnetGroup = new CfnSubnetGroup(this, 'RedisSubnetGroup', {
			description: 'Subnet group for Redis cluster',
			subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
		});

		this.redisSecurityGroup = new SecurityGroup(this, 'RedisSecurityGroup', {
			vpc,
			description: 'Security group for Redis cluster',
		});

		this.redisSecurityGroup.addIngressRule(
			Peer.ipv4(vpc.vpcCidrBlock),
			Port.tcp(6379),
			'Allow Redis access from VPC'
		);

		this.redisCluster = new CfnReplicationGroup(this, 'RedisCluster', {
			replicationGroupId: 'pocket-pod-redis',
			replicationGroupDescription: 'Redis cluster for job queue',
			cacheNodeType: 'cache.t3.micro',
			numCacheClusters: 1,
			engine: 'redis',
			engineVersion: '7.0',
			cacheSubnetGroupName: redisSubnetGroup.ref,
			securityGroupIds: [this.redisSecurityGroup.securityGroupId],
			automaticFailoverEnabled: false,
		});
	}
} 