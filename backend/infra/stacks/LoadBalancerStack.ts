import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
	ApplicationLoadBalancer,
	ApplicationProtocol,
	ApplicationTargetGroup,
	TargetType,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface LoadBalancerStackProps extends StackProps {
	vpc: IVpc;
}

export class LoadBalancerStack extends Stack {
	public readonly alb: ApplicationLoadBalancer;
	public readonly apiTargetGroup: ApplicationTargetGroup;

	constructor(scope: Construct, props: LoadBalancerStackProps) {
		super(scope, 'LoadBalancerStack', props);

		const { vpc } = props;

		// Create Application Load Balancer
		this.alb = new ApplicationLoadBalancer(this, 'PocketPodALB', {
			vpc,
			internetFacing: true,
			loadBalancerName: 'pocket-pod-alb',
		});

		// Create target group for API service
		this.apiTargetGroup = new ApplicationTargetGroup(this, 'ApiTargetGroup', {
			port: 3000,
			protocol: ApplicationProtocol.HTTP,
			vpc,
			targetType: TargetType.IP,
			healthCheck: {
				path: '/health',
				healthyHttpCodes: '200',
			},
		});

		// Create listener for ALB
		this.alb.addListener('PublicListener', {
			port: 80,
			open: true,
			defaultTargetGroups: [this.apiTargetGroup],
		});

		// Output important values
		new CfnOutput(this, 'LoadBalancerDNS', {
			value: this.alb.loadBalancerDnsName,
			description: 'DNS name of the load balancer',
		});
	}
} 