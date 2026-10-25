import shopify from './shopify.js';

export async function getReceiptPaymentTemplateId() {
  const query = `
    query {
      paymentTermsTemplates {
        id
        name
        paymentTermsType
      }
    }
  `;

  try {
    const { data, errors } = await shopify.request(query);

    if (errors?.length > 0) {
      throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const templates = data?.paymentTermsTemplates || [];
    const receiptTemplate = templates.find(t => t.paymentTermsType === 'RECEIPT');

    if (!receiptTemplate) {
      throw new Error('❌ Шаблон с типом RECEIPT не найден');
    }

    return receiptTemplate.id;
  } catch (error) {
    console.error('❌ Ошибка получения шаблона paymentTerms (RECEIPT):', error);
    throw error;
  }
}
