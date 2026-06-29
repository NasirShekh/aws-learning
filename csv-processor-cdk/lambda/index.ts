import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  SNSClient,
  PublishCommand,
} from "@aws-sdk/client-sns";

interface CsvRecord {
  id: string;
  name: string;
  role: string;
}

const s3Client = new S3Client({});

const dynamoClient =
  DynamoDBDocumentClient.from(
    new DynamoDBClient({})
  );

const snsClient = new SNSClient({});

export const processFile = async (
  event: any
): Promise<{
  statusCode: number;
  body: string;
}> => {
  try {
    const sqsMessage =
      JSON.parse(
        event.Records[0].body
      );

    const s3Event =
      sqsMessage.Records[0];

    const bucketName =
      s3Event.s3.bucket.name;

    const objectKey =
      decodeURIComponent(
        s3Event.s3.object.key
      );

    console.log(
      `Processing file: ${objectKey}`
    );

    const response =
      await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );

    const fileContent =
      await response.Body?.transformToString();

    if (!fileContent) {
      throw new Error(
        "CSV file is empty."
      );
    }

    const rows =
      fileContent.split(/\r?\n/);

    // Skip CSV Header
    const dataRows =
      rows.slice(1);

    let processedCount = 0;
    for (const row of dataRows) {
      if (!row.trim()) continue;

      const [
        id,
        name,
        role,
      ] = row.split(",");

      const item: CsvRecord = {
        id: id.trim(),
        name: name.trim(),
        role: role.trim(),
      };

      await dynamoClient.send(
        new PutCommand({
          TableName:
            process.env.TABLE_NAME!,
          Item: item,
        })
      );
      processedCount++;

      console.log(
        `Inserted record: ${item.id}`
      );
    }
    await snsClient.send(
      new PublishCommand({
        TopicArn:
          process.env.TOPIC_ARN!,

        Subject:
          "CSV Processing Completed",

        Message:
          `File: ${objectKey}

Records Processed: ${processedCount}

Status: SUCCESS`,
      })
    );

    return {
      statusCode: 200,
      body:
        "CSV processed successfully",
    };
  } catch (error) {
    console.error(
      "Error processing CSV:",
      error
    );

    throw error;
  }
};