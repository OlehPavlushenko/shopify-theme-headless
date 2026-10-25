import shopify from './shopify.js';

export async function completeDraftOrder(draftOrderGid) {
  const mutation = `
    mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
      draftOrderComplete(id: $id, paymentPending: $paymentPending) {
        draftOrder {
          id
          order {
            id
            name
            customer {
              id
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const { data, errors } = await shopify.request(mutation, {
      variables: { id: draftOrderGid }
    });

    if (errors?.length) {
      throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const userErrors = data?.draftOrderComplete?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(`User errors: ${userErrors.map(e => e.message).join(', ')}`);
    }

    const order = data?.draftOrderComplete?.draftOrder?.order;
    if (!order) {
      throw new Error('Order не вернулся в ответе draftOrderComplete');
    }

    return order;
  } catch (error) {
    console.error('❌ Ошибка при завершении draftOrder:', error);
    throw error;
  }
}
