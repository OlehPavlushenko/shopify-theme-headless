import shopify from './shopify.js';

export async function updateDraftOrder(draftOrderId, note) {
  const mutation = `
    mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
      draftOrderUpdate(id: $id, input: $input) {
        draftOrder {
          id
          note2
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: draftOrderId,
    input: { 
      note: note
    },
  };

  const { data, errors } = await shopify.request(mutation, { variables });

  if (errors?.length > 0 || data.draftOrderUpdate.userErrors.length > 0) {
    throw new Error(
      `Ошибка при обновлении note: ${errors?.[0]?.message || data.draftOrderUpdate.userErrors[0].message}`
    );
  }

  return data.draftOrderUpdate.draftOrder;
}
