// Collection sort options (?sort=): sortKey is the ProductCollectionSortKeys value (a collection),
// allKey the ProductSortKeys one (all products, /collections/all)
export const SORTS = [
  { value: 'featured', label: 'Featured', sortKey: 'COLLECTION_DEFAULT', allKey: 'BEST_SELLING' },
  { value: 'best-selling', label: 'Best selling', sortKey: 'BEST_SELLING', allKey: 'BEST_SELLING' },
  { value: 'price-asc', label: 'Price, low to high', sortKey: 'PRICE', allKey: 'PRICE' },
  { value: 'price-desc', label: 'Price, high to low', sortKey: 'PRICE', allKey: 'PRICE', reverse: true },
  { value: 'newest', label: 'Newest', sortKey: 'CREATED', allKey: 'CREATED_AT', reverse: true },
  { value: 'title-asc', label: 'Alphabetically, A–Z', sortKey: 'TITLE', allKey: 'TITLE' },
];
