export const handler = async (
  event: any
) => {

  console.log(
    "Sending Welcome Email"
  );

  console.log(
    `Welcome ${event.name}`
  );

  console.log(
    `Employee Code : ${event.generatedEmployeeCode}`
  );

  return {
    message:
      "Employee Registered Successfully",

    employee: event,
  };
};