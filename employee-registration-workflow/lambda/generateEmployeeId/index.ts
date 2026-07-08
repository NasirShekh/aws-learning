export const handler = async (
  event: any
) => {

  console.log(
    "Generating Employee Code"
  );

  event.generatedEmployeeCode =
    `EMP-${Date.now()}`;

  return event;
};