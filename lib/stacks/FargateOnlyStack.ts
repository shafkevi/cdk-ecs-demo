import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';


import LoadBalancedFargateService from "../constructs/LoadBalancedFargateService";

export default class FargateStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `Vpc-${id}`, { maxAzs: 2 });

    const fargateCluster = new ecs.Cluster(this, `FargateCluster-${id}`, {
      vpc
    });

    const { loadBalancedFargateService } = new LoadBalancedFargateService(this, `FargateService-${id}`, {
      dockerfileDirectory: "./src/ecs/expressApi",
      cluster: fargateCluster,

    });



  }
}
