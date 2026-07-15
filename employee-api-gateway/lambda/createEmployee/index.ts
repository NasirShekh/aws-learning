import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client =
  new DynamoDBClient({});

const docClient =
  DynamoDBDocumentClient.from(client);

export const handler = async (
  event: any
) => {

  try {

    const body =
      JSON.parse(event.body);

    await docClient.send(
      new PutCommand({

        TableName:
          process.env.TABLE_NAME,

        Item: {
          employeeId:
            body.employeeId,

          name:
            body.name,

          department:
            body.department,

          salary:
            body.salary,
        }

      })
    );

    return {
      statusCode: 201,

      body: JSON.stringify({

        message:
          "Employee created successfully",

      }),

    };

  } catch (error) {

    console.error(error);

    return {

      statusCode: 500,

      body: JSON.stringify({

        message:
          "Internal Server Error",

      }),

    };

  }

};

