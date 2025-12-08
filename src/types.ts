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
    // PC-specific verification fields
    condition?: string;
    benchmark_results?: string;
    testing_notes?: string;
    warranty_info?: string;
    // Compatibility fields
    socket_type?: string;
    form_factor?: string;
    power_requirements?: string;
    dimensions?: string;
    // Trust features
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

// Order interface
export interface Order extends CosmicObject {
  type: 'orders';
  metadata: {
    // Order identifiers
    order_id: string;
    order_number: string;
    seller_id: string;
    product_id?: string;
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    
    // Customer/Buyer details
    buyer_name: string;
    buyer_email: string;
    buyer_phone?: string;
    
    // Shipping details
    shipping_name?: string;
    shipping_address: ShippingAddress | null;
    
    // Order items
    line_items: LineItem[];
    
    // Payment details
    order_total: number; // in dollars
    amount_total: number; // in cents
    amount_subtotal: number; // in cents
    currency: string;
    payment_status: 'paid' | 'unpaid' | 'pending' | 'refunded';
    
    // Timestamps
    order_date: string;
    created_at: string;
    paid_at?: string;
    
    // Stripe info
    stripe_payment_id?: string;
    
    // Legacy/compatibility (for old orders or backward compatibility)
    product?: Product;
    seller?: Seller;
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