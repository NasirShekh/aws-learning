export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2));

  const token = event.authorizationToken;

  if (token === "Bearer my-secret-token") {
    return {
      principalId: "admin-user",

      policyDocument: {
        Version: "2012-10-17",

        Statement: [
          {
            Action: "execute-api:Invoke",

            Effect: "Allow",

            Resource: event.methodArn,
          },
        ],
      },
    };
  }

  throw new Error("Unauthorized");
};
