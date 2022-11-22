import { Construct } from "constructs";

import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecs_patterns } from 'aws-cdk-lib';


export interface LoadBalancedFargateServiceProps {
  cluster: ecs.Cluster,
  dockerfileDirectory: string,
  cpu?: number,
  environment?: { [key: string]: string },
  secrets?: { [key: string]: ecs.Secret }
  desiredCount?: number,
  containerPort?: number,
  memoryLimitMiB?: number,
  publicLoadBalancer?: boolean,
}

export default class LoadBalancedFargateService extends Construct {
  public readonly loadBalancedFargateService: ecs_patterns.ApplicationLoadBalancedFargateService;
  constructor(scope: Construct, id: string, props: LoadBalancedFargateServiceProps) {
    super(scope, id);

    const { 
      cluster,
      dockerfileDirectory,
      cpu,
      secrets,
      environment,
      desiredCount,
      containerPort,
      memoryLimitMiB,
      publicLoadBalancer,
    } = props;

    this.loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `LoadBalancedFargateService`, {
      assignPublicIp: true,
      cluster: cluster,
      cpu: cpu ?? 256,
      desiredCount: desiredCount ?? 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(dockerfileDirectory),
        containerPort: containerPort ?? 8080,
        environment,
        secrets,
      },
      memoryLimitMiB: memoryLimitMiB ?? 512,
      publicLoadBalancer: publicLoadBalancer ?? true,
    });

  }
}
