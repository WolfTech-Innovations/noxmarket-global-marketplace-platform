// src/pages/api/seller/create.ts
import type { APIRoute } from 'astro';
import { createUser, cosmic } from '@/lib/cosmic';
import { getSessionFromCookies } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const session = getSessionFromCookies(cookies);

    if (!session || !session.userId) {
      return redirect('/login?error=Please log in first');
    }

    const formData = await request.formData();
    const businessName = formData.get('businessName')?.toString();
    const storeDescription = formData.get('storeDescription')?.toString();
    const phone = formData.get('phone')?.toString();

    if (!businessName) {
      return redirect('/become-seller?error=Business name is required');
    }

    // Check if already a seller
    try {
      const existingSeller = await cosmic.objects
        .findOne({ type: 'sellers', 'metadata.user_id': session.userId })
        .props('id');

      if (existingSeller.object) {
        return redirect('/dashboard?error=You already have a seller account');
      }
    } catch (error: any) {
      if (error?.status !== 404) throw error;
    }

    // Create seller profile
    const sellerProfile = await createUser({
      type: 'sellers',
      title: businessName,
      slug: `seller-${nanoid(10)}`,
      metadata: {
        business_name: businessName,
        email: session.email,
        user_id: session.userId,
        store_description: storeDescription || '',
        stripe_account_id: '',
        stripe_onboarding_complete: false,
        phone: phone || '',
        owner_name: session.name,
        created_at: new Date().toISOString()
      }
    });

    console.log('Seller profile created:', sellerProfile.id);

    // Mark user as seller in Cosmic
    await cosmic.objects.updateOne(session.userId, {
      metadata: { is_seller: true }
    });

    // Clear session and force re-login
    cookies.delete('session', { path: '/' });
    return redirect('/login?message=Seller account created! Please log back in.');

  } catch (error) {
    console.error('Become seller error:', error);
    return redirect('/become-seller?error=Failed to create seller account');
  }
};