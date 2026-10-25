import shopify from './shopify.js';

// 🔍 Поиск кастомера по email
export async function getCustomerByEmail(email) {
  const operation = `
    query {
      customers(first: 1, query: "email:${email}") {
        edges {
          node {
            id
            email
            tags
            emailMarketingConsent {
              marketingState
              marketingOptInLevel
            }
          }
        }
      }
    }
  `;

  try {
    const { data, errors } = await shopify.request(operation);

    if (errors?.length > 0) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }

    const customerNode = data?.customers?.edges?.[0]?.node;

    if (!customerNode) {
      return null; // кастомера просто нет
    }

    return {
      id: customerNode.id,
      email: customerNode.email,
      tags: customerNode.tags,
      emailMarketingState: customerNode.emailMarketingConsent?.marketingState,
      emailMarketingOptInLevel: customerNode.emailMarketingConsent?.marketingOptInLevel
    };
  } catch (error) {
    console.error('❌ Ошибка getCustomerByEmail:', error);
    throw error;
  }
}

// ➕ Создание нового кастомера с подпиской

export async function createCustomer(email) {
  const operation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          emailMarketingConsent {
            marketingOptInLevel
            marketingState
          }
          tags
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    email: email,
    emailMarketingConsent: {
      marketingOptInLevel: 'SINGLE_OPT_IN',
      marketingState: 'SUBSCRIBED'
    },
    tags: ['newsletter']
  };

  try {
    const { data, errors } = await shopify.request(operation, {
      variables: { input }
    });

    if (errors && errors.length > 0) {
      throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const customer = data?.customerCreate?.customer;
    const userErrors = data?.customerCreate?.userErrors || [];

    if (userErrors.length > 0) {
      throw new Error(`User errors: ${userErrors.map(e => e.message).join(', ')}`);
    }

    return customer;
  } catch (error) {
    console.error('❌ Ошибка createCustomer:', error);
    throw error;
  }
}

// 🔄 Обновление email consent
export async function updateEmailMarketingConsent(customerId) {
  const operation = `
    mutation customerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) {
        customer {
          id
          emailMarketingConsent {
            marketingOptInLevel
            marketingState
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    customerId,
    emailMarketingConsent: {
      marketingOptInLevel: 'SINGLE_OPT_IN',
      marketingState: 'SUBSCRIBED'
    }
  };

  try {
    const { data, errors } = await shopify.request(operation, {
      variables: { input }
    });

    if (errors?.length) {
      throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const userErrors = data?.customerEmailMarketingConsentUpdate?.userErrors || [];
    if (userErrors.length) {
      throw new Error(`User errors: ${userErrors.map(e => e.message).join(', ')}`);
    }

    return data.customerEmailMarketingConsentUpdate.customer;
  } catch (error) {
    console.error('❌ Ошибка updateEmailMarketingConsent:', error);
    throw error;
  }
}

// 🏷 Добавление тегов к кастомеру
export async function updateTags(customerId, tags) {
  //console.log('🏷 Добавляем теги:', customerId, tags);

  const operation = `
    mutation tagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const { data, errors } = await shopify.request(operation, {
      variables: {
        id: customerId,
        tags: tags
      }
    });

    if (errors?.length > 0) {
      console.error('GraphQL errors при добавлении тегов:', errors);
      throw new Error(errors.map(e => e.message).join(', '));
    }

    const userErrors = data?.tagsAdd?.userErrors || [];
    if (userErrors.length > 0) {
      console.error('User errors при добавлении тегов:', userErrors);
      throw new Error(userErrors.map(e => e.message).join(', '));
    }

    //console.log('✅ Теги успешно добавлены:', data.tagsAdd.node.id);
    return data.tagsAdd.node;
  } catch (error) {
    console.error('❌ Ошибка updateTags:', error);
    throw error;
  }
}

