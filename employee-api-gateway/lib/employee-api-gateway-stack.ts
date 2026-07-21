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

    const employeeTable = new dynamodb.Table(this, "EmployeeTable", {
      tableName: "employee-api-table",

      partitionKey: {
        name: "employeeId",
        type: dynamodb.AttributeType.STRING,
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, "EmployeeApiLambdaRole", {
      roleName: "employee-api-lambda-role",

      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    );

    const createEmployee = new NodejsFunction(this, "CreateEmployee", {
      functionName: "create-employee-lambda",

      runtime: lambda.Runtime.NODEJS_20_X,

      entry: path.join(__dirname, "../lambda/createEmployee/index.ts"),

      handler: "handler",

      role: lambdaRole,

      environment: {
        TABLE_NAME: employeeTable.tableName,
      },
    });

    const getEmployees = new NodejsFunction(this, "GetEmployees", {
      functionName: "get-employees-lambda",

      runtime: lambda.Runtime.NODEJS_20_X,

      entry: path.join(__dirname, "../lambda/getEmployees/index.ts"),

      handler: "handler",

      role: lambdaRole,

      environment: {
        TABLE_NAME: employeeTable.tableName,
      },
    });

    const getEmployeeById = new NodejsFunction(this, "GetEmployeeById", {
      functionName: "get-employee-by-id-lambda",

      runtime: lambda.Runtime.NODEJS_20_X,

      entry: path.join(__dirname, "../lambda/getEmployeeById/index.ts"),

      handler: "handler",

      role: lambdaRole,

      environment: {
        TABLE_NAME: employeeTable.tableName,
      },
    });

    const authorizerLambda = new NodejsFunction(this, "AuthorizerLambda", {
      functionName: "employee-api-authorizer",

      runtime: lambda.Runtime.NODEJS_20_X,

      entry: path.join(__dirname, "../lambda/authorizer/index.ts"),

      handler: "handler",

      role: lambdaRole,
    });

    const api = new apigateway.RestApi(this, "EmployeeApi", {
      restApiName: "employee-api",

      description: "Employee Management API",

      deployOptions: {
        stageName: "dev",
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
    });

    api.addGatewayResponse("UnauthorizedResponse", {
      type: apigateway.ResponseType.UNAUTHORIZED,

      statusCode: "401",

      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },

      templates: {
        "application/json": JSON.stringify({
          success: false,
          statusCode: 401,
          message: "Unauthorized",
        }),
      },
    });

    api.addGatewayResponse("AccessDeniedResponse", {
      type: apigateway.ResponseType.ACCESS_DENIED,

      statusCode: "403",

      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },

      templates: {
        "application/json": JSON.stringify({
          success: false,
          statusCode: 403,
          message: "Access Denied",
        }),
      },
    });

    api.addGatewayResponse("ThrottledResponse", {
      type: apigateway.ResponseType.THROTTLED,

      statusCode: "429",

      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },

      templates: {
        "application/json": JSON.stringify({
          success: false,
          statusCode: 429,
          message: "Too Many Requests",
        }),
      },
    });

    const apiKey = api.addApiKey("EmployeeApiKey", {
      apiKeyName: "employee-api-key",
      description: "API Key for Employee API",
    });

    const usagePlan = api.addUsagePlan("EmployeeUsagePlan", {
      name: "employee-usage-plan",

      description: "Usage plan for Employee API",

      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },

      quota: {
        limit: 1000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    usagePlan.addApiKey(apiKey);

    const tokenAuthorizer = new apigateway.TokenAuthorizer(
      this,
      "EmployeeTokenAuthorizer",
      {
        handler: authorizerLambda,
      },
    );

    const employeeModel = api.addModel("EmployeeRequestModel", {
      contentType: "application/json",

      modelName: "EmployeeRequestModel",

      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,

        title: "Employee",

        type: apigateway.JsonSchemaType.OBJECT,

        required: ["employeeId", "name", "department", "salary"],

        properties: {
          employeeId: {
            type: apigateway.JsonSchemaType.STRING,
          },

          name: {
            type: apigateway.JsonSchemaType.STRING,
          },

          department: {
            type: apigateway.JsonSchemaType.STRING,
          },

          salary: {
            type: apigateway.JsonSchemaType.NUMBER,
          },
        },
      },
    });

    const requestValidator = new apigateway.RequestValidator(
      this,
      "EmployeeRequestValidator",
      {
        restApi: api,

        requestValidatorName: "employee-request-validator",

        validateRequestBody: true,

        validateRequestParameters: false,
      },
    );

    const employees = api.root.addResource("employees", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,

        allowMethods: apigateway.Cors.ALL_METHODS,

        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const employeeById = employees.addResource("{employeeId}");

    employees.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createEmployee),
      {
        requestModels: {
          "application/json": employeeModel,
        },

        authorizationType: apigateway.AuthorizationType.CUSTOM,
        authorizer: tokenAuthorizer,
        requestValidator: requestValidator,
        apiKeyRequired: true,
      },
    );

    employees.addMethod("GET", new apigateway.LambdaIntegration(getEmployees));

    employeeById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getEmployeeById),
    );

    employeeTable.grantReadWriteData(createEmployee);

    employeeTable.grantReadData(getEmployees);

    employeeTable.grantReadData(getEmployeeById);

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "CreateEmployeeLambda", {
      value: createEmployee.functionName,
    });

    new cdk.CfnOutput(this, "EmployeeTableName", {
      value: employeeTable.tableName,
    });
  }
}
