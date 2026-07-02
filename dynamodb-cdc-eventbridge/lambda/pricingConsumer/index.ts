export const handler = async (
  event: any
): Promise<void> => {

  console.log(
    "===== Pricing Consumer ====="
  );

  console.log(
    JSON.stringify(event, null, 2)
  );

  const {
    productId,
    oldPrice,
    newPrice,
  } = event.detail;

  console.log(
    `Product ID : ${productId}`
  );

  console.log(
    `Old Price  : ${oldPrice}`
  );

  console.log(
    `New Price  : ${newPrice}`
  );

  console.log(
    "Pricing updated successfully."
  );
};