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

    console.log('Signup attempt:', { name, email, userType, businessName });

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

    let user;

    if (userType === 'seller') {
      // For sellers, create ONLY a seller object with all needed fields
      const sellerData = {
        type: 'sellers',
        title: businessName,
        metadata: {
          business_name: businessName,
          email,
          password_hash: passwordHash, // Store password in seller object
          user_type: 'seller',
          store_description: '',
          stripe_account_id: '',
          stripe_onboarding_complete: false,
          phone: '',
          owner_name: name // Store the person's name separately
        }
      };

      console.log('Creating seller:', { businessName, email });
      user = await createUser(sellerData);
      console.log('Seller created:', user.id);

    } else {
      // For buyers, create a regular user object
      const userData = {
        type: 'users',
        title: name,
        metadata: {
          name,
          email,
          password_hash: passwordHash,
          user_type: 'buyer'
        }
      };

      console.log('Creating buyer:', { name, email });
      user = await createUser(userData);
      console.log('Buyer created:', user.id);
    }

    // Create session
    const sessionToken = createSessionToken();
    const session: any = {
      userId: user.id,
      email: user.metadata.email,
      userType: userType,
    };

    // Set name based on user type
    if (userType === 'seller') {
      session.name = user.metadata.business_name || businessName;
      session.sellerId = user.id;
      session.businessName = user.metadata.business_name;
    } else {
      session.name = user.metadata.name || name;
    }

    console.log('Session created:', { userId: user.id, userType, name: session.name });

    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken);

    // Redirect based on user type
    if (userType === 'seller') {
      return redirect('/seller/dashboard');
    }

    return redirect('/profile');
  } catch (error) {
    console.error('Signup error:', error);
    return redirect('/signup?error=Failed to create account');
  }
};