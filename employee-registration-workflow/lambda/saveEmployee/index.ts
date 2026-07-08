import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client =
  DynamoDBDocumentClient.from(
    new DynamoDBClient({})
  );

export const handler = async (
  event: any
) => {

  console.log(
    "Saving Employee"
  );

  await client.send(
    new PutCommand({
      TableName:
        process.env.TABLE_NAME,

      Item: {
        employeeId:
          event.employeeId,

        name:
          event.name,

        age:
          event.age,

        department:
          event.department,
      },
    })
  );

  return event;
};