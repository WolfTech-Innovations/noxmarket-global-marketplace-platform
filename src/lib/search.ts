import type { Product, SearchFilters } from '@/types';

export function searchProducts(products: Product[], filters: SearchFilters): Product[] {
  let filtered = [...products];
  
  // Filter by search query
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(product => 
      product.metadata.product_name.toLowerCase().includes(query) ||
      product.metadata.description.toLowerCase().includes(query)
    );
  }
  
  // Filter by category
  if (filters.category) {
    filtered = filtered.filter(product => 
      product.metadata.category?.slug === filters.category
    );
  }
  
  // Filter by price range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(product => 
      product.metadata.price >= filters.minPrice!
    );
  }
  
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(product => 
      product.metadata.price <= filters.maxPrice!
    );
  }
  
  // Filter by stock
  if (filters.inStock !== undefined) {
    filtered = filtered.filter(product => 
      product.metadata.in_stock === filters.inStock
    );
  }
  
  return filtered;
}

export function sortProducts(products: Product[], sortBy: 'price-asc' | 'price-desc' | 'name' | 'newest'): Product[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.metadata.price - b.metadata.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.metadata.price - a.metadata.price);
    case 'name':
      return sorted.sort((a, b) => 
        a.metadata.product_name.localeCompare(b.metadata.product_name)
      );
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return sorted;
  }
}