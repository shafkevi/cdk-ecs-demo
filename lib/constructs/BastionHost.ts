import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';

export interface BastionHostProps {
  auroraDatabase: rds.DatabaseCluster;
  vpc: ec2.IVpc,
}

export default class BastionHost extends Construct {
  public readonly bastionHost: ec2.BastionHostLinux;

  constructor(scope: Construct, id: string, props: BastionHostProps) {
    super(scope, id);

    const { 
      vpc,
      auroraDatabase
    } = props;

    this.bastionHost = new ec2.BastionHostLinux(this, `BastionInstance`, {
      vpc: vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC
      },
    });

    auroraDatabase.connections.allowFrom(
      this.bastionHost,
      ec2.Port.tcp(auroraDatabase.clusterEndpoint.port)
    );
         
    // Command to connect to Postgres database locally
    // Each user would need to have IAM permissions to run the SSM start-session command.
    const sshTunnelCommandAurora = `aws ssm start-session`+
    ` --target ${this.bastionHost.instanceId}`+
    ` --document-name AWS-StartPortForwardingSessionToRemoteHost` +
    ` --parameters '{"host":["${auroraDatabase.clusterEndpoint.hostname}"],"portNumber":["5432"], "localPortNumber":["5433"]}'`

    new CfnOutput(this, `sshTunnelCommandAurora`, { value: sshTunnelCommandAurora });

  }
}
