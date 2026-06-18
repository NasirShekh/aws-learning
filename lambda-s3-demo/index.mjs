import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({});
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
);

export const handler = async (event) => {
  try {
    const bucket =
      event.Records[0].s3.bucket.name;

    const key =
      decodeURIComponent(
        event.Records[0].s3.object.key
      );

    console.log("Bucket:", bucket);
    console.log("File:", key);

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    const content =
      await response.Body.transformToString();

    console.log(content);

    const rows =
      content.split("\n");

    for (const row of rows) {
      if (!row.trim()) continue;

      const [id, name, role] =
        row.split(",");

      await dynamo.send(
        new PutCommand({
          TableName: "EmployeeData",
          Item: {
            id: id.trim(),
            name: name.trim(),
            role: role.trim()
          }
        })
      );
    }

    return {
      statusCode: 200,
      body: "Success"
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: error.message
    };
  }
};