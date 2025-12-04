import { createBucketClient } from '@cosmicjs/sdk';

export const cosmic = createBucketClient({
  bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG,
  readKey: import.meta.env.COSMIC_READ_KEY,
  writeKey: import.meta.env.COSMIC_WRITE_KEY
});

// Helper function for error handling
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Product functions
export async function getProducts() {
  try {
    const response = await cosmic.objects
      .find({ type: 'products' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(slug: string) {
  try {
    const response = await cosmic.objects
      .findOne({ type: 'products', slug })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch product');
  }
}

// Category functions
export async function getCategories() {
  try {
    const response = await cosmic.objects
      .find({ type: 'categories' })
      .props(['id', 'title', 'slug', 'metadata']);
    
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch categories');
  }
}

// Seller functions
export async function getSeller(id: string) {
  try {
    const response = await cosmic.objects
      .findOne({ type: 'sellers', id })
      .props(['id', 'title', 'slug', 'metadata']);
    
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch seller');
  }
}

export async function getSellerByEmail(email: string) {
  try {
    const response = await cosmic.objects
      .find({ type: 'sellers', 'metadata.email': email })
      .props(['id', 'title', 'slug', 'metadata']);
    
    const sellers = response.objects;
    return sellers.length > 0 ? sellers[0] : null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch seller');
  }
}

// Order functions
export async function getSellerOrders(sellerId: string) {
  try {
    const response = await cosmic.objects
      .find({ type: 'orders', 'metadata.seller': sellerId })
      .props(['id', 'title', 'metadata'])
      .depth(1);
    
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch orders');
  }
}

export async function createOrder(orderData: any) {
  try {
    const response = await cosmic.objects.insertOne(orderData);
    return response.object;
  } catch (error) {
    throw new Error('Failed to create order');
  }
}

// User authentication functions
export async function getUserByEmail(email: string) {
  try {
    const response = await cosmic.objects
      .find({ type: 'users', 'metadata.email': email })
      .props(['id', 'title', 'metadata']);
    
    const users = response.objects;
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch user');
  }
}

export async function createUser(userData: any) {
  try {
    const response = await cosmic.objects.insertOne(userData);
    return response.object;
  } catch (error) {
    throw new Error('Failed to create user');
  }
}

export async function updateUser(userId: string, userData: any) {
  try {
    const response = await cosmic.objects.updateOne(userId, userData);
    return response.object;
  } catch (error) {
    throw new Error('Failed to update user');
  }
}