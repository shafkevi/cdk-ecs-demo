import { Construct } from "constructs";

import { aws_ecs as ecs, SecretValue } from 'aws-cdk-lib';
import { aws_codepipeline as codepipeline } from 'aws-cdk-lib';
import { aws_codepipeline_actions as codepipeline_actions } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';


export interface PipelineProps {
  branch: string,
  repoName: string,
  fargateService: ecs.FargateService,
}

export default class Pipeline extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const { 
      branch,
      repoName,
      fargateService
    } = props;

    const ecrRepository = new ecr.Repository(this, `CodeRepository`);

    const codebuildProject = new codebuild.PipelineProject(this, `CodeBuildPipelineProject`, {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
              commands: [
                  "$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)",
                  "cd src/ecs/",
                  "docker build -t $REPOSITORY_URI:latest .",
                  "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION"
              ]
          },
          post_build: {
              commands: [
                  "docker push $REPOSITORY_URI:latest",
                  "docker push $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                  "export imageTag=$CODEBUILD_RESOLVED_SOURCE_VERSION",
                  "printf '[{\"name\":\"app\",\"imageUri\":\"%s\"}]' $REPOSITORY_URI:$imageTag > imagedefinitions.json"
              ]
          }
      },
      env: {
          // save the imageTag environment variable as a CodePipeline Variable
           "exported-variables": ["imageTag"]
      },
      artifacts: {
          files: "imagedefinitions.json",
          "secondary-artifacts": {
              "imagedefinitions": {
                  "files": "imagedefinitions.json",
                  "name": "imagedefinitions"
              }
          }
      }
      }),
      environmentVariables: {
        REPOSITORY_URI: { value: ecrRepository.repositoryUri }
      }
    })

    ecrRepository.grantPullPush(codebuildProject);

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GithubCommit',
      repo: repoName,
      oauthToken: SecretValue.secretsManager('githubToken'),
      output: sourceOutput,
      owner: 'prod', // company name?
      branch: branch,
    });

    const imageDefinitions = new codepipeline.Artifact('imagedefinitions')
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'ImageBuilding',
      input: sourceOutput,
      outputs: [imageDefinitions],
      project: codebuildProject,
    });

    // Optional
    const manualApprovalProd = new codepipeline_actions.ManualApprovalAction({
      actionName: 'ManualApproval',
      runOrder: 1,
    })

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'ImageDeploy',
      service: fargateService,
      input: imageDefinitions,
      runOrder: 2,
    });

    this.pipeline = new codepipeline.Pipeline(this, `Pipeline`, {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        },
        {
          stageName: 'Deploy',
          actions: [
            manualApprovalProd, // Optional
            deployAction
          ]
        }
      ]
    });

  }
}
