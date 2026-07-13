export const handler = async (
  event: any
) => {

  console.log(
    "Admin Notification"
  );

  console.log(event);

  return {
    message:
      "Admin has been notified."
  };

};