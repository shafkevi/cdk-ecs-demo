import { Construct } from "constructs";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { aws_rds as rds } from "aws-cdk-lib";


export interface AuroraDatabaseProps {
  vpc: ec2.IVpc,
  instances?: number,
}

export default class AuroraDatabase extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  constructor(scope: Construct, id: string, props: AuroraDatabaseProps) {
    super(scope, id);

    const { 
      vpc, 
      instances,

    } = props;

    const subnetGroup = new rds.SubnetGroup(this, `SubnetGroup`, {
      vpc,
      description: "Subnet Group for ThreeTierWebApp",
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      })
    });


    this.cluster = new rds.DatabaseCluster(this, `Database`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({version: rds.AuroraPostgresEngineVersion.VER_13_4}),
      defaultDatabaseName: "app",
      instances: instances ?? 2,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
        vpc,
      },
      subnetGroup,
    });

  }
}
