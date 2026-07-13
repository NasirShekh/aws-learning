export const handler = async () => {

  console.log(
    "Generating Employee Code"
  );

  return {
    employeeCode:
      `EMP-${Date.now()}`
  };

};