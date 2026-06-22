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

export const processFile = async (
  event: any
): Promise<{
  statusCode: number;
  body: string;
}> => {
  try {
    const bucketName =
      event.Records[0].s3.bucket.name;

    const objectKey =
      decodeURIComponent(
        event.Records[0].s3.object.key
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
      fileContent.split("\n");

    // Skip CSV Header
    const dataRows =
      rows.slice(1);

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

      console.log(
        `Inserted record: ${item.id}`
      );
    }

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