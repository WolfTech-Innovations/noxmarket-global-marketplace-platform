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

// Shipping Address interface
export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Line Item interface
export interface LineItem {
  product_name: string;
  product_id: string;
  quantity: number;
  amount: number;
  currency: string;
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
    condition?: string;
    benchmark_results?: string;
    testing_notes?: string;
    warranty_info?: string;
    socket_type?: string;
    form_factor?: string;
    power_requirements?: string;
    dimensions?: string;
    verified?: boolean;
    escrow_eligible?: boolean;
  };
}

// Seller interface
export interface Seller extends CosmicObject {
  type: 'sellers';
  metadata: {
    business_name: string;
    email: string;
    user_id: string;
    store_description?: string;
    profile_image?: {
      url: string;
      imgix_url: string;
    };
    stripe_account_id?: string;
    stripe_onboarding_complete: boolean;
    phone?: string;
    owner_name?: string;
    total_earnings?: number;
    total_orders?: number;
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

export interface Clickz {
  id: string;
  slug: string;
  title: string;
  metadata: {
    video: { url: string };
    thumbnail: { url: string; imgix_url: string };
    category: string;
    price: number;
    seller_name: string;
    description: string;
    likes: number;
  };
}

// Order interface — maps to 'ship-notifications' Cosmic type
export interface Order extends CosmicObject {
  type: 'ship-notifications';
  metadata: {
    // Seller
    seller_id: string;

    // Buyer
    buyer_name: string;
    buyer_email: string;

    // Shipping — stored as plain textarea string
    shipping_address: string;

    // Items — stored as plain string e.g. "RTX 3080 ×1, DDR4 RAM ×2"
    items: string;

    // Payment — stored as formatted string e.g. "USD $149.99"
    total: string;

    // Stripe
    stripe_session: string;

    // Status
    shipped: boolean;

    // Timestamps
    created_at: string;
  };
}

// User interface
export interface User extends CosmicObject {
  type: 'users';
  metadata: {
    name: string;
    email: string;
    password_hash: string;
    is_seller: boolean;
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
export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  isSeller: boolean;
  sellerId?: string;
  businessName?: string;
}

// Search filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}