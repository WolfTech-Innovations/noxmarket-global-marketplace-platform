// src/pages/api/seller/create.ts
import type { APIRoute } from 'astro';
import { createUser, cosmic } from '@/lib/cosmic';
import { getSession, storeSession, setSessionCookie } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    // Get session token from cookies
    const sessionToken = cookies.get('session')?.value;
    
    if (!sessionToken) {
      return redirect('/login?error=Please log in first');
    }

    const session = getSession(sessionToken);

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

    // Check if user already has a seller profile
    try {
      const existingSeller = await cosmic.objects
        .findOne({
          type: 'sellers',
          'metadata.user_id': session.userId
        })
        .props('id');

      if (existingSeller.object) {
        return redirect('/dashboard?error=You already have a seller account');
      }
    } catch (error: any) {
      // 404 is fine, means they don't have a seller profile yet
      if (error?.status !== 404) {
        throw error;
      }
    }

    // Create seller profile
    const sellerData = {
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
    };

    console.log('Creating seller profile for user:', session.userId);
    const sellerProfile = await createUser(sellerData);
    console.log('Seller profile created:', sellerProfile.id);

    // Update user to mark them as a seller
    await cosmic.objects.updateOne(session.userId, {
      metadata: {
        is_seller: true
      }
    });

    // Update session with new seller info
    const updatedSession: any = {
      ...session,
      isSeller: true,
      sellerId: sellerProfile.id,
      businessName: businessName
    };

    // Store updated session
    storeSession(sessionToken, updatedSession);
    setSessionCookie(cookies, sessionToken, updatedSession);

    return redirect('/dashboard?success=Seller account created successfully');
  } catch (error) {
    console.error('Become seller error:', error);
    return redirect('/become-seller?error=Failed to create seller account');
  }
};