import { createBucketClient } from '@cosmicjs/sdk';
import type { Clickz } from '@/types';

export const cosmic = createBucketClient({
  bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG,
  readKey: import.meta.env.COSMIC_READ_KEY,
  writeKey: import.meta.env.COSMIC_WRITE_KEY
});

function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Product functions
export async function getProducts() {
  try {
    const response = await cosmic.objects
      .find({ type: 'products' })
      .props('id,title,slug,metadata')
      .depth(1);
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return [];
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(slug: string) {
  try {
    const response = await cosmic.objects
      .findOne({ type: 'products', slug })
      .props('id,title,slug,metadata')
      .depth(1);
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return null;
    throw new Error('Failed to fetch product');
  }
}

// Category functions
export async function getCategories() {
  try {
    const response = await cosmic.objects
      .find({ type: 'categories' })
      .props('id,title,slug,metadata');
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return [];
    throw new Error('Failed to fetch categories');
  }
}

export async function getClickz(): Promise<Clickz[]> {
  try {
    const res = await cosmic.objects
      .find({ type: 'clickz' })
      .props('id,slug,title,metadata')
      .limit(50);
    return res.objects as Clickz[];
  } catch {
    return [];
  }
}

// Seller functions
export async function getSeller(id: string) {
  try {
    const response = await cosmic.objects
      .findOne({ type: 'sellers', id })
      .props('id,title,slug,metadata');
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return null;
    throw new Error('Failed to fetch seller');
  }
}

export async function getSellerByEmail(email: string) {
  try {
    const response = await cosmic.objects
      .find({ type: 'sellers', 'metadata.email': email })
      .props('id,title,slug,metadata')
      .limit(1);
    return response.objects.length > 0 ? response.objects[0] : null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return null;
    throw new Error('Failed to fetch seller');
  }
}

// Order functions — reads from ship-notifications
export async function getSellerOrders(sellerId: string) {
  try {
    const response = await cosmic.objects
      .find({
        type: 'ship-notifications',
        'metadata.seller_id': sellerId,
      })
      .props('id,title,slug,metadata')
      .sort('-created_at')
      .limit(50);
    return response.objects ?? [];
  } catch (error) {
    if (hasStatus(error) && error.status === 404) return [];
    throw new Error('Failed to fetch orders');
  }
}

export async function createOrder(orderData: any) {
  try {
    const response = await cosmic.objects.insertOne(orderData);
    return response.object;
  } catch {
    throw new Error('Failed to create order');
  }
}

// User functions
export async function getUserByEmail(email: string) {
  try {
    const usersResult = await cosmic.objects
      .find({ type: 'users', 'metadata.email': email })
      .props('id,slug,title,type,metadata')
      .limit(1);
    if (usersResult.objects?.length > 0) return usersResult.objects[0];
  } catch (error: any) {
    if (error?.status !== 404) console.error('Error fetching from users:', error);
  }

  try {
    const sellersResult = await cosmic.objects
      .find({ type: 'sellers', 'metadata.email': email })
      .props('id,slug,title,type,metadata')
      .limit(1);
    if (sellersResult.objects?.length > 0) return sellersResult.objects[0];
  } catch (error: any) {
    if (error?.status !== 404) console.error('Error fetching from sellers:', error);
  }

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
    throw new Error(`Failed to create user: ${error.message || error.toString()}`);
  }
}

export async function updateUser(userId: string, userData: any) {
  try {
    const response = await cosmic.objects.updateOne(userId, userData);
    return response.object;
  } catch {
    throw new Error('Failed to update user');
  }
}