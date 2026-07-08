export const handler = async (
  event: any
) => {

  console.log(
    "Validating Employee"
  );

  console.log(
    JSON.stringify(event, null, 2)
  );

  if (
    !event.employeeId ||
    !event.name ||
    !event.department
  ) {
    throw new Error(
      "Employee details are missing."
    );
  }

  return event;
};