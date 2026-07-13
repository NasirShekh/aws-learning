export const handler = async (
  event: any
) => {

  console.log(
    JSON.stringify(event, null, 2)
  );

  return {
    message: "Welcome Email Sent"
  };

};