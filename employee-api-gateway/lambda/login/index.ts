import jwt from "jsonwebtoken";

export const handler = async () => {
  const token = jwt.sign(
    {
      userId: "123",
      username: "Nasir",
      role: "ADMIN",
    },
    "my-secret-key",
    {
      expiresIn: "1h",
    },
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
    }),
  };
};
