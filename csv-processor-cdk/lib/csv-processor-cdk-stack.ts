import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";

export class CsvProcessorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const employeeTable = new dynamodb.Table(
      this,
      "EmployeeTable",
      {
        tableName:
          "csv-processor-employee-table",

        partitionKey: {
          name: "id",
          type:
            dynamodb.AttributeType.STRING,
        },

        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,

        removalPolicy:
          cdk.RemovalPolicy.DESTROY,
      }
    );

    // S3 Bucket
    const csvBucket = new s3.Bucket(
      this,
      "CsvUploadBucket",
      {
        bucketName:
          "csv-processor-upload-bucket-nasir-2026",

        autoDeleteObjects: true,

        removalPolicy:
          cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda Role
    const lambdaRole =
      new iam.Role(
        this,
        "CsvProcessorLambdaRole",
        {
          roleName:
            "csv-processor-lambda-role",

          assumedBy:
            new iam.ServicePrincipal(
              "lambda.amazonaws.com"
            ),
        }
      );

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Lambda Function
    const csvProcessorLambda =
      new NodejsFunction(
        this,
        "CsvProcessorLambda",
        {
          functionName:
            "csv-processor-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/index.ts"
          ),

          handler: "processFile",

          role: lambdaRole,

          environment: {
            TABLE_NAME:
              employeeTable.tableName,
          },
        }
      );
    // Permissions
    employeeTable.grantReadWriteData(
      csvProcessorLambda
    );

    csvBucket.grantRead(
      csvProcessorLambda
    );

    // S3 Trigger
    csvBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,

      new s3n.LambdaDestination(
        csvProcessorLambda
      )
    );

    // Outputs
    new cdk.CfnOutput(
      this,
      "BucketName",
      {
        value:
          csvBucket.bucketName,
      }
    );

    new cdk.CfnOutput(
      this,
      "TableName",
      {
        value:
          employeeTable.tableName,
      }
    );

    new cdk.CfnOutput(
      this,
      "LambdaName",
      {
        value:
          csvProcessorLambda.functionName,
      }
    );
  }
}