import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const department = event.queryStringParameters?.department;

    console.log("Department:", department);

    let response;

    if (department) {
      response = await docClient.send(
        new ScanCommand({
          TableName: process.env.TABLE_NAME,

          FilterExpression: "#dept = :department",

          ExpressionAttributeNames: {
            "#dept": "department",
          },

          ExpressionAttributeValues: {
            ":department": department,
          },
        }),
      );
    } else {
      response = await docClient.send(
        new ScanCommand({
          TableName: process.env.TABLE_NAME,
        }),
      );
    }

    return {
      statusCode: 200,

      body: JSON.stringify(response.Items),
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
