export const handler = async (
  event: any
) => {

  console.log(
    "Parallel Output"
  );

  console.log(
    JSON.stringify(event, null, 2)
  );

  return {

    employeeCode:
      event[0].Payload.employeeCode,

    badgeId:
      event[1].Payload.badgeId,

    notification:
      event[2].Payload.notification,

  };

};