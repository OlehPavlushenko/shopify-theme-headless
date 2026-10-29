// Shopify ids: the API's global ids (gid://shopify/<Type>/<n>) and the numeric ids Liquid and the
// theme's scripts use. Pure, for server and browser code.

// gid://shopify/ProductVariant/123 (also with a ?query) -> 123
export const numericId = (gid) => Number(String(gid).split('/').pop().split('?')[0]);

// A product without options: one variant, Shopify's "Default Title" (product.has_only_default_variant).
// The compare column's query names the lists allVariants / allOptions.
export function hasOnlyDefaultVariant(product) {
  const variants = product.allVariants ?? product.variants;
  const options = product.allOptions ?? product.options;
  return variants.nodes.length === 1 && options[0]?.optionValues[0]?.name === 'Default Title';
}

// A variant id as the Storefront API takes it: a numeric id becomes its gid, a gid (or nothing) stays
export const variantGid = (id) => (!id || String(id).startsWith('gid://') ? id : `gid://shopify/ProductVariant/${id}`);
