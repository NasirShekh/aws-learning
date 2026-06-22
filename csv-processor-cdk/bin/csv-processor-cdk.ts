#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { CsvProcessorStack } from "../lib/csv-processor-cdk-stack";

const app = new cdk.App();

new CsvProcessorStack(
  app,
  "csv-processor-dev",
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "ap-south-1",
    },
  }
);