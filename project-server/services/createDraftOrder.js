import shopify from './shopify.js';
import { getReceiptPaymentTemplateId } from './getPaymentTermsTemplates.js';

export async function createDraftOrder(payload) {
  const { products, contract_information, delivery_information, payment_information } = payload;

  const lineItems = products.items.map(item => ({
    variantId: `gid://shopify/ProductVariant/${item.variant_id}`,
    quantity: item.quantity
  }));

  const noteParts = [];
  if (contract_information.call_me) noteParts.push('📞 Перезвонить клиенту');
  if (contract_information.comment) noteParts.push(`💬 Комментарий: ${contract_information.comment}`);

  const [firstName, ...rest] = contract_information.full_name.trim().split(' ');
  const lastName = rest.join(' ') || '-';

  let address1 = '';

  if (delivery_information.delivery_type === 'WAREHOUSE') {
    address1 = `${delivery_information.delivery_type}: ${delivery_information.present}, ${delivery_information.warehouse}`;
  } else {
    const { present, address, house, ap } = delivery_information;
    address1 = `${delivery_information.delivery_type}: ${present}, ${address} ${house}${ap ? `, кв. ${ap}` : ''}`;
  }

  const PAYMENT_TYPE_LABELS = {
    PAY_ON_DELIVERY: "Накладений платіж",
    CARD: "Оплата онлайн",
    BANK_DETAILS: "Переказ на рахунок банку"
  };

  const paymentTypeCode = payment_information.payment_type;
  const payment_type = PAYMENT_TYPE_LABELS[paymentTypeCode];

  const email = contract_information.email?.trim() || `guest-${Date.now()}@example.com`;

  const input = {
    lineItems,
    metafields: [
      {
        namespace: 'custom',
        key: 'payment_method',
        type: 'single_line_text_field',
        value: payment_type
      }
    ],
    shippingAddress: {
      firstName,
      lastName,
      phone: contract_information.phone,
      address1: address1,
      city: delivery_information.city,
      country: "Ukraine",
      zip: "11111"
    },
    note: noteParts.join('\n'),
  };

  //if (paymentTypeCode !== 'CARD') {
    input.paymentTerms = {
      paymentTermsTemplateId: await getReceiptPaymentTemplateId()
    };
  //}

  input.email = email;

  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          invoiceUrl
          createdAt
          email
          shippingAddress {
            firstName
            lastName
            phone
          }
          totalLineItemsPriceSet {
            shopMoney {
              amount
            }
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
              }
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
      variables: { input }
    });
    

    if (errors?.length > 0) {
      throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
    }

    if (!data?.draftOrderCreate) {
      console.error('📦 Ответ без draftOrderCreate:', data);
      throw new Error('draftOrderCreate отсутствует в ответе Shopify');
    }

    const userErrors = data.draftOrderCreate.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(`User errors: ${userErrors.map(e => e.message).join(', ')}`);
    }

    return data.draftOrderCreate.draftOrder;
  } catch (error) {
    console.error('❌ Ошибка draftOrderCreate:', error);
    throw error;
  }
}
