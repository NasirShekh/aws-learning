export const handler = async (
  event: any
): Promise<void> => {

  console.log(
    "===== Search Consumer ====="
  );

  console.log(
    JSON.stringify(event, null, 2)
  );

  const {
    productId,
    oldName,
    newName,
  } = event.detail;

  console.log(
    `Product ID : ${productId}`
  );

  console.log(
    `Old Name   : ${oldName}`
  );

  console.log(
    `New Name   : ${newName}`
  );

};