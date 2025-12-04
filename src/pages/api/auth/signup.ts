import type { APIRoute } from 'astro';
import { createUser, getUserByEmail } from '@/lib/cosmic';
import { hashPassword, createSessionToken, storeSession, setSessionCookie } from '@/lib/auth';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const userType = formData.get('userType')?.toString() as 'buyer' | 'seller';
    const businessName = formData.get('businessName')?.toString();
    
    if (!name || !email || !password || !userType) {
      return redirect('/signup?error=Missing required fields');
    }
    
    if (userType === 'seller' && !businessName) {
      return redirect('/signup?error=Business name is required for sellers');
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return redirect('/signup?error=Email already registered');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user in Cosmic
    const userData = {
      type: 'users',
      title: name,
      metadata: {
        name,
        email,
        password_hash: passwordHash,
        user_type: userType,
        seller_id: userType === 'seller' ? nanoid() : ''
      }
    };
    
    const user = await createUser(userData);
    
    // If seller, create seller profile
    if (userType === 'seller' && businessName) {
      const sellerData = {
        type: 'sellers',
        title: businessName,
        metadata: {
          business_name: businessName,
          email,
          store_description: '',
          stripe_account_id: '',
          stripe_onboarding_complete: false,
          phone: ''
        }
      };
      
      await createUser(sellerData);
    }
    
    // Create session
    const sessionToken = createSessionToken();
    const session = {
      userId: user.id,
      email: user.metadata.email,
      name: user.metadata.name,
      userType: user.metadata.user_type,
      sellerId: user.metadata.seller_id || undefined
    };
    
    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken);
    
    return redirect('/profile');
  } catch (error) {
    console.error('Signup error:', error);
    return redirect('/signup?error=Failed to create account');
  }
};