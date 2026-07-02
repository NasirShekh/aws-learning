export const handler = async (
  event: any
): Promise<void> => {

  console.log(
    "===== Inventory Consumer ====="
  );

  console.log(
    JSON.stringify(event, null, 2)
  );

  const {
    productId,
    oldStock,
    newStock,
  } = event.detail;

  console.log(
    `Product ID : ${productId}`
  );

  console.log(
    `Old Stock  : ${oldStock}`
  );

  console.log(
    `New Stock  : ${newStock}`
  );

  /*
    Future Logic

    1. Update Inventory System
    2. Notify Warehouse
    3. Trigger Restock if needed
  */

  console.log(
    "Inventory updated successfully."
  );
};