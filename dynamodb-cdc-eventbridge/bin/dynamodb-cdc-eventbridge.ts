#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { DynamodbCdcEventbridgeStack } from "../lib/dynamodb-cdc-eventbridge-stack";

const app = new cdk.App();

new DynamodbCdcEventbridgeStack(
  app,
  "DynamodbCdcEventbridgeStack",
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);