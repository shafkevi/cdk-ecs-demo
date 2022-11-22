import { Construct } from "constructs";
import { aws_cloudwatch as cloudwatch } from "aws-cdk-lib";
import { aws_rds as rds } from "aws-cdk-lib";

export interface MonitoringAlarmsProps {
  cluster: rds.DatabaseCluster,
  cpuAlarmProps: { evaluationPeriods: number, threshold: number},
}

export default class MonitoringAlarms extends Construct {
  public readonly cpuAlarm: cloudwatch.Alarm;
  public readonly memoryAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringAlarmsProps) {
    super(scope, id);

    const { 
      cluster,
      cpuAlarmProps,
    } = props;

    this.cpuAlarm = cluster
      .metricCPUUtilization()
      .createAlarm(
        this, 
        `cpuAlarm`, 
        cpuAlarmProps
      );

  }
}
