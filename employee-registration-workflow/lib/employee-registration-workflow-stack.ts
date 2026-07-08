import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class EmployeeRegistrationWorkflowStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    /*Employee Table*/

    const employeeTable =
      new dynamodb.Table(
        this,
        "EmployeeTable",
        {
          tableName:
            "employee-registration-table",

          partitionKey: {
            name: "employeeId",
            type:
              dynamodb.AttributeType.STRING,
          },

          billingMode:
            dynamodb.BillingMode.PAY_PER_REQUEST,

          removalPolicy:
            cdk.RemovalPolicy.DESTROY,
        }
      );

    /*Lambda IAM Role */

    const lambdaRole =
      new iam.Role(
        this,
        "EmployeeWorkflowLambdaRole",
        {
          roleName:
            "employee-workflow-lambda-role",

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

    /*Validate Employee Lambda */

    const validateEmployee =
      new NodejsFunction(
        this,
        "ValidateEmployee",
        {
          functionName:
            "validate-employee-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/validateEmployee/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,
        }
      );
    /*Save Employee Lambda */

    const saveEmployee =
      new NodejsFunction(
        this,
        "SaveEmployee",
        {
          functionName:
            "save-employee-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/saveEmployee/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,

          environment: {
            TABLE_NAME:
              employeeTable.tableName,
          },
        }
      );

    employeeTable.grantReadWriteData(
      saveEmployee
    );

    /*Generate Employee ID Lambda*/

    const generateEmployeeId =
      new NodejsFunction(
        this,
        "GenerateEmployeeId",
        {
          functionName:
            "generate-employee-id-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/generateEmployeeId/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,
        }
      );


    /*Send Welcome Email Lambda*/

    const sendWelcomeEmail =
      new NodejsFunction(
        this,
        "SendWelcomeEmail",
        {
          functionName:
            "send-welcome-email-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/sendWelcomeEmail/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,
        }
      );

    /*  Validate Employee Task */

    const validateEmployeeTask =
      new tasks.LambdaInvoke(
        this,
        "Validate Employee Task",
        {
          lambdaFunction:
            validateEmployee,

          outputPath:
            "$.Payload",
        }
      );

    /*ve Employee Task */
    const saveEmployeeTask =
      new tasks.LambdaInvoke(
        this,
        "Save Employee Task",
        {
          lambdaFunction:
            saveEmployee,

          outputPath:
            "$.Payload",
        }
      );

    /*nerate Employee ID Task */
    const generateEmployeeIdTask =
      new tasks.LambdaInvoke(
        this,
        "Generate Employee ID Task",
        {
          lambdaFunction:
            generateEmployeeId,

          outputPath:
            "$.Payload",
        }
      );

    /*send Welcome Email Task */
    const sendWelcomeEmailTask =
      new tasks.LambdaInvoke(
        this,
        "Send Welcome Email Task",
        {
          lambdaFunction:
            sendWelcomeEmail,

          outputPath:
            "$.Payload",
        }
      );

    const employeeRejected =
      new sfn.Fail(
        this,
        "Employee Rejected",
        {
          cause:
            "Employee age must be at least 18",

          error:
            "AgeValidationFailed",
        }
      );


    const ageValidation =
      new sfn.Choice(
        this,
        "Is Employee Adult?"
      );

    /*Workow Definition*/
    const workflowDefinition =
      validateEmployeeTask
        .next(

          ageValidation

            .when(

              sfn.Condition.numberGreaterThanEquals(
                "$.age",
                18
              ),

              saveEmployeeTask
                .next(generateEmployeeIdTask)
                .next(sendWelcomeEmailTask)

            )

            .otherwise(
              employeeRejected
            )

        );

    /*Emplee Registration State Machine*/
    const employeeRegistrationStateMachine =
      new sfn.StateMachine(
        this,
        "EmployeeRegistrationStateMachine",
        {
          stateMachineName:
            "employee-registration-workflow",

          definitionBody:
            sfn.DefinitionBody.fromChainable(
              workflowDefinition
            ),
        }
      );


    new cdk.CfnOutput(
      this,
      "StateMachineArn",
      {
        value:
          employeeRegistrationStateMachine
            .stateMachineArn,
      }
    );
    new cdk.CfnOutput(
      this,
      "EmployeeTableName",
      {
        value:
          employeeTable.tableName,
      }
    );

    new cdk.CfnOutput(
      this,
      "ValidateLambda",
      {
        value:
          validateEmployee.functionName,
      }
    );

    new cdk.CfnOutput(
      this,
      "SaveLambda",
      {
        value:
          saveEmployee.functionName,
      }
    );

    new cdk.CfnOutput(
      this,
      "GenerateLambda",
      {
        value:
          generateEmployeeId.functionName,
      }
    );

    new cdk.CfnOutput(
      this,
      "EmailLambda",
      {
        value:
          sendWelcomeEmail.functionName,
      }
    );

  }
}