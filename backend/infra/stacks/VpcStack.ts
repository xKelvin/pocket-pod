import { Stack, StackProps } from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends Stack {
	public readonly vpc: Vpc;

	constructor(scope: Construct, props?: StackProps) {
		super(scope, 'VpcStack', props);

		// Create VPC with public and private subnets
		this.vpc = new Vpc(this, 'PocketPodVpc', {
			maxAzs: 2,
			natGateways: 1, // Cost optimization - single NAT gateway
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: 'Public',
					subnetType: SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: 'Private',
					subnetType: SubnetType.PRIVATE_WITH_EGRESS,
				},
			],
		});
	}
} 