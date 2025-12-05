// Base Cosmic object interface
export interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Product interface
export interface Product extends CosmicObject {
  type: 'products';
  metadata: {
    product_name: string;
    description: string;
    price: number;
    product_images?: Array<{
      url: string;
      imgix_url: string;
    }>;
    category?: Category;
    seller: Seller;
    stock_quantity: number;
    in_stock: boolean;
  };
}

// Seller interface
export interface Seller extends CosmicObject {
  type: 'sellers';
  metadata: {
    business_name: string;
    email: string;
    user_id: string; // Link to user account
    store_description?: string;
    profile_image?: {
      url: string;
      imgix_url: string;
    };
    stripe_account_id?: string;
    stripe_onboarding_complete: boolean;
    phone?: string;
    owner_name?: string;
  };
}

// Category interface
export interface Category extends CosmicObject {
  type: 'categories';
  metadata: {
    category_name: string;
    description?: string;
    category_icon?: {
      url: string;
      imgix_url: string;
    };
  };
}

// Order interface
export interface Order extends CosmicObject {
  type: 'orders';
  metadata: {
    order_number: string;
    product: Product;
    seller: Seller;
    buyer_name: string;
    buyer_email: string;
    buyer_phone?: string;
    shipping_address: string;
    order_total: number;
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'refunded';
    stripe_payment_id?: string;
  };
}

// User interface (stored in Cosmic for authentication)
// Now unified - all users can buy, and optionally become sellers
export interface User extends CosmicObject {
  type: 'users';
  metadata: {
    name: string;
    email: string;
    password_hash: string;
    is_seller: boolean; // True if they've created a seller profile
    created_at?: string;
  };
}

// API response types
export interface CosmicResponse<T> {
  objects: T[];
  total?: number;
  limit?: number;
  skip?: number;
}

// Authentication types
// Unified session - no more userType distinction
export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  isSeller: boolean; // True if they have a seller profile
  sellerId?: string; // ID of their seller profile (if they have one)
  businessName?: string; // Their business name (if seller)
}

// Search filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}