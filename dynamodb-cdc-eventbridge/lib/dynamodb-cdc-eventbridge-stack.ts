import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

import * as iam from "aws-cdk-lib/aws-iam";

import * as path from "path";

export class DynamodbCdcEventbridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
    ==========================================
    Product Table
    ==========================================
    */

    const productTable = new dynamodb.Table(
      this,
      "ProductTable",
      {
        tableName: "product-table",

        partitionKey: {
          name: "productId",
          type: dynamodb.AttributeType.STRING,
        },

        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,

        stream:
          dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,

        removalPolicy:
          cdk.RemovalPolicy.DESTROY,
      }
    );

    /*
    ==========================================
    Custom Event Bus
    ==========================================
    */

    const productEventBus =
      new events.EventBus(
        this,
        "ProductEventBus",
        {
          eventBusName:
            "product-event-bus",
        }
      );

    /*
    ==========================================
    CDC Lambda Role
    ==========================================
    */

    const cdcLambdaRole =
      new iam.Role(
        this,
        "CdcProcessorRole",
        {
          roleName:
            "cdc-processor-role",

          assumedBy:
            new iam.ServicePrincipal(
              "lambda.amazonaws.com"
            ),
        }
      );

    cdcLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    /*
    ==========================================
    CDC Processor Lambda
    ==========================================
    */

    const cdcProcessor =
      new NodejsFunction(
        this,
        "CdcProcessorLambda",
        {
          functionName:
            "cdc-processor-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry:
            path.join(
              __dirname,
              "../lambda/cdcProcessor/index.ts"
            ),

          handler: "handler",

          role:
            cdcLambdaRole,

          environment: {
            EVENT_BUS_NAME:
              productEventBus.eventBusName,
          },
        }
      );

    /*
    ==========================================
    Inventory Consumer
    ==========================================
    */

    const inventoryConsumer =
      new NodejsFunction(
        this,
        "InventoryConsumer",
        {
          functionName:
            "inventory-consumer-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry:
            path.join(
              __dirname,
              "../lambda/inventoryConsumer/index.ts"
            ),

          handler: "handler",
        }
      );

    /*
    ==========================================
    Pricing Consumer
    ==========================================
    */

    const pricingConsumer =
      new NodejsFunction(
        this,
        "PricingConsumer",
        {
          functionName:
            "pricing-consumer-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry:
            path.join(
              __dirname,
              "../lambda/pricingConsumer/index.ts"
            ),

          handler: "handler",
        }
      );

    /*
    ==========================================
    Search Consumer
    ==========================================
    */

    const searchConsumer =
      new NodejsFunction(
        this,
        "SearchConsumer",
        {
          functionName:
            "search-consumer-lambda",

          runtime:
            lambda.Runtime.NODEJS_20_X,

          entry:
            path.join(
              __dirname,
              "../lambda/searchConsumer/index.ts"
            ),

          handler: "handler",
        }
      );

    /*
    ==========================================
    DynamoDB Stream → CDC Lambda
    ==========================================
    */

    cdcProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(
        productTable,
        {
          startingPosition:
            lambda.StartingPosition.LATEST,

          batchSize: 1,

          retryAttempts: 2,
        }
      )
    );

    /*
    ==========================================
    Permissions
    ==========================================
    */

    productTable.grantStreamRead(
      cdcProcessor
    );

    productEventBus.grantPutEventsTo(
      cdcProcessor
    );

    /*
    ==========================================
    EventBridge Rule
    ProductPriceChanged
    ==========================================
    */

    new events.Rule(
      this,
      "PriceChangedRule",
      {
        eventBus:
          productEventBus,

        eventPattern: {
          source: [
            "product.service",
          ],

          detailType: [
            "ProductPriceChanged",
          ],
        },

        targets: [
          new targets.LambdaFunction(
            pricingConsumer
          ),
        ],
      }
    );

    /*
    ==========================================
    EventBridge Rule
    ProductStockChanged
    ==========================================
    */

    new events.Rule(
      this,
      "StockChangedRule",
      {
        eventBus:
          productEventBus,

        eventPattern: {
          source: [
            "product.service",
          ],

          detailType: [
            "ProductStockChanged",
          ],
        },

        targets: [
          new targets.LambdaFunction(
            inventoryConsumer
          ),
        ],
      }
    );

    /*
    ==========================================
    EventBridge Rule
    ProductNameChanged
    ==========================================
    */

    new events.Rule(
      this,
      "NameChangedRule",
      {
        eventBus:
          productEventBus,

        eventPattern: {
          source: [
            "product.service",
          ],

          detailType: [
            "ProductNameChanged",
          ],
        },

        targets: [
          new targets.LambdaFunction(
            searchConsumer
          ),
        ],
      }
    );

    /*
    ==========================================
    Outputs
    ==========================================
    */

    new cdk.CfnOutput(
      this,
      "ProductTableName",
      {
        value:
          productTable.tableName,
      }
    );

    new cdk.CfnOutput(
      this,
      "EventBusName",
      {
        value:
          productEventBus.eventBusName,
      }
    );
  }
}