import shopify from './shopify.js';

export async function orderMarkAsPaid(orderId) {
  const mutation = `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        order {
          id
          name
          canMarkAsPaid
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: { id: orderId }
  };

  const { data, errors } = await shopify.request(mutation, { variables });

  if (errors?.length > 0 || data.orderMarkAsPaid.userErrors.length > 0) {
    throw new Error(
      `Ошибка orderMarkAsPaid: ${errors?.[0]?.message || data.orderMarkAsPaid.userErrors[0].message}`
    );
  }

  return data.orderMarkAsPaid.order;
}
