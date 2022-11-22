import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';

import LoadBalancedFargateService from "../constructs/LoadBalancedFargateService";
import FargateMonitoringAlarms from "../constructs/FargateMonitoringAlarms";
import AuroraDatabase from "../constructs/AuroraDatabase";
import AuroraMonitoringAlarms from "../constructs/AuroraMonitoringAlarms";
import BastionHost from "../constructs/BastionHost";
import Pipeline from "../pipeline/pipeline";

export default class FargateStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `AppVpc-${id}`, {
      cidr: "11.192.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      /**
       * Each entry in this list configures a Subnet Group
       *
       * PRIVATE_ISOLATED: Isolated Subnets do not route traffic to the Internet (in this VPC).
       * PRIVATE_WITH_NAT.: Subnet that routes to the internet, but not vice versa.
       * PUBLIC..: Subnet connected to the Internet.
       */
      subnetConfiguration: [
        // {
        //   cidrMask: 24,
        //   name: 'nat',
        //   subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        // },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }, 
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
    });

    const auroraDatabase = new AuroraDatabase(this, `AuroraDatabase-${id}`, {
      vpc,
    });

    const auroraSecret = (name: string) => ecs.Secret.fromSecretsManager(
      auroraDatabase.cluster.secret!,
      name
    );

    const {
       cpuAlarm: auroraCpuAlarm
    } = new AuroraMonitoringAlarms(this, `AuroraAlarms-${id}`, {
      cluster: auroraDatabase.cluster,
      cpuAlarmProps: {
        evaluationPeriods: 1,
        threshold: 5,
      }
    });

    const fargateCluster = new ecs.Cluster(this, `FargateCluster-${id}`, {
      vpc
    });

    // Might be better to have the application read from secret manager instead of environment variables.
    // However, there is a way to setup a connection to secrets manager, so maybe just configure that instead.
    const { loadBalancedFargateService } = new LoadBalancedFargateService(this, `FargateService-${id}`, {
      dockerfileDirectory: "./src/ecs",
      cluster: fargateCluster,
      secrets: {
        DB_CONNECTION: auroraSecret("engine"),
        DB_DATABASE: auroraSecret("dbname"),
        DB_HOST: auroraSecret("host"),
        DB_PORT: auroraSecret("port"),
        DB_USERNAME: auroraSecret("username"),
        DB_PASSWORD: auroraSecret("password")
      }
    });
    // Give the taskRole permissions to read the secrets.
    auroraDatabase.cluster.secret?.grantRead(loadBalancedFargateService.taskDefinition.taskRole);

    const { cpuAlarm, memoryAlarm } = new FargateMonitoringAlarms(this, `FargateServiceAlarms-${id}`, {
      service: loadBalancedFargateService.service,
      cpuAlarmProps: {
        evaluationPeriods: 1,
        threshold: 5,
      },
      memoryAlarmProps: {
        evaluationPeriods: 1,
        threshold: 5,
      }
    });

    auroraDatabase.cluster.connections.allowFrom(
      loadBalancedFargateService.service, 
      ec2.Port.tcp(auroraDatabase.cluster.clusterEndpoint.port),
    );


    const bastionHost = new BastionHost(this, `BastionHost-${id}`, {
      vpc,
      auroraDatabase: auroraDatabase.cluster,
    });


    // const pipeline = new Pipeline(this, `Pipeline-${id}`, {
    //   branch: 'main',
    //   repoName: 'cdk-ecs-demo',
    //   fargateService: loadBalancedFargateService.service,
    // });


  }
}
