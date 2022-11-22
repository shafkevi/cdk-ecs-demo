import { Construct } from "constructs";
import { aws_cloudwatch as cloudwatch } from "aws-cdk-lib";
import { aws_ecs as ecs } from "aws-cdk-lib";

export interface MonitoringAlarmsProps {
  service: ecs.FargateService,
  cpuAlarmProps: { evaluationPeriods: number, threshold: number},
  memoryAlarmProps: { evaluationPeriods: number, threshold: number},
}

export default class MonitoringAlarms extends Construct {
  public readonly cpuAlarm: cloudwatch.Alarm;
  public readonly memoryAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringAlarmsProps) {
    super(scope, id);

    const { 
      service,
      cpuAlarmProps,
      memoryAlarmProps,
    } = props;

    this.cpuAlarm = service
      .metricCpuUtilization()
      .createAlarm(
        this, 
        `cpuAlarm`, 
        cpuAlarmProps
      );

    this.memoryAlarm = service
      .metricMemoryUtilization()
      .createAlarm(
        this, 
        `memoryAlarm`, 
        memoryAlarmProps
      );



  }
}
