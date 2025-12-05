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
      .props(['id', 'title', 'slug', 'metadata'])
      .limit(1);

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

// User authentication functions - searches BOTH users and sellers
export async function getUserByEmail(email: string) {
  try {
    // First, try to find in users
    const usersResult = await cosmic.objects
      .find({
        type: 'users',
        'metadata.email': email,
      })
      .props('id,slug,title,type,metadata')
      .limit(1);

    if (usersResult.objects && usersResult.objects.length > 0) {
      return usersResult.objects[0];
    }
  } catch (error: any) {
    // 404 just means no users found, which is fine
    if (error?.status !== 404) {
      console.error('Error fetching user from users:', error);
    }
  }

  try {
    // If not found in users, try sellers
    const sellersResult = await cosmic.objects
      .find({
        type: 'sellers',
        'metadata.email': email,
      })
      .props('id,slug,title,type,metadata')
      .limit(1);

    if (sellersResult.objects && sellersResult.objects.length > 0) {
      return sellersResult.objects[0];
    }
  } catch (error: any) {
    // 404 just means no sellers found, which is fine
    if (error?.status !== 404) {
      console.error('Error fetching user from sellers:', error);
    }
  }

  // User not found in either collection
  return null;
}

export async function createUser(userData: any) {
  try {
    console.log('Creating user in Cosmic:', { 
      type: userData.type, 
      title: userData.title,
      email: userData.metadata?.email,
      slug: userData.slug 
    });

    const response = await cosmic.objects.insertOne(userData);

    console.log('User created successfully:', response.object.id);
    return response.object;
  } catch (error: any) {
    console.error('Cosmic insertOne error:', error);
    console.error('Failed userData:', JSON.stringify(userData, null, 2));

    // Log detailed error information
    if (error) {
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
        data: error.data,
        stack: error.stack
      });
    }

    // Throw a more descriptive error
    const errorMsg = error.message || error.toString();
    throw new Error(`Failed to create user: ${errorMsg}`);
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