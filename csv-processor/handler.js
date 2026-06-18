const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const s3Client = new S3Client({});

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
);

module.exports.processFile = async (event) => {
  try {
    const bucket =
      event.Records[0].s3.bucket.name;

    const key =
      decodeURIComponent(
        event.Records[0].s3.object.key
      );

    console.log("Bucket:", bucket);
    console.log("Key:", key);

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const fileContent =
      await response.Body.transformToString();

    console.log(fileContent);

    const rows = fileContent.split("\n");

    for (const row of rows) {
      if (!row.trim()) continue;

      const [id, name, role] =
        row.split(",");

      await dynamo.send(
        new PutCommand({
          TableName:
            process.env.TABLE_NAME,
          Item: {
            id: id.trim(),
            name: name.trim(),
            role: role.trim(),
          },
        })
      );
    }

    return {
      statusCode: 200,
      body: "Success",
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};