import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export class EmployeeApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const employeeTable =
      new dynamodb.Table(
        this,
        "EmployeeTable",
        {
          tableName:
            "employee-api-table",

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

    const lambdaRole =
      new iam.Role(
        this,
        "EmployeeApiLambdaRole",
        {
          roleName:
            "employee-api-lambda-role",

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

    const createEmployee =
      new NodejsFunction(
        this,
        "CreateEmployee",
        {
          functionName:
            "create-employee-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/createEmployee/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,

          environment: {
            TABLE_NAME:
              employeeTable.tableName,
          },
        }
      );

    const getEmployees =
      new NodejsFunction(
        this,
        "GetEmployees",
        {
          functionName:
            "get-employees-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/getEmployees/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,

          environment: {
            TABLE_NAME:
              employeeTable.tableName,
          },
        }
      );

    const getEmployeeById =
      new NodejsFunction(
        this,
        "GetEmployeeById",
        {
          functionName:
            "get-employee-by-id-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry: path.join(
            __dirname,
            "../lambda/getEmployeeById/index.ts"
          ),

          handler: "handler",

          role: lambdaRole,

          environment: {
            TABLE_NAME:
              employeeTable.tableName,
          },
        }
      );


    const api =
      new apigateway.RestApi(
        this,
        "EmployeeApi",
        {
          restApiName:
            "employee-api",

          description:
            "Employee Management API",

          deployOptions: {
            stageName: "dev",
          },
        }
      );


    const employees =
      api.root.addResource(
        "employees"
      );

    const employeeById =
      employees.addResource(
        "{employeeId}"
      );


    employees.addMethod(
      "POST",

      new apigateway.LambdaIntegration(
        createEmployee
      )
    );

    employees.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        getEmployees
      )
    );

    employeeById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        getEmployeeById
      )
    );


    employeeTable.grantReadWriteData(
      createEmployee
    );

    employeeTable.grantReadData(
      getEmployees
    );

    employeeTable.grantReadData(
      getEmployeeById
    );

    new cdk.CfnOutput(
      this,
      "ApiUrl",
      {
        value: api.url,
      }
    );

    new cdk.CfnOutput(
      this,
      "CreateEmployeeLambda",
      {
        value:
          createEmployee.functionName,
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
  }
}

