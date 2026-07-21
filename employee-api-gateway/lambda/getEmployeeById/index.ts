import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const employeeId = event.pathParameters.employeeId;

    const response = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,

        Key: {
          employeeId,
        },
      }),
    );

    if (!response.Item) {
      return {
        statusCode: 404,

        body: JSON.stringify({
          message: "Employee not found",
        }),
      };
    }

    return {
      statusCode: 200,

      body: JSON.stringify(response.Item),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};
