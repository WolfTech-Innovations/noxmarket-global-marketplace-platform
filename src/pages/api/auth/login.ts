import type { APIRoute } from 'astro';
import { getUserByEmail, cosmic } from '@/lib/cosmic';
import { verifyPassword, createSessionToken, storeSession, setSessionCookie } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return redirect('/login?error=Email and password are required');
    }

    // Get user from Cosmic
    const user = await getUserByEmail(email);

    if (!user) {
      return redirect('/login?error=Invalid email or password');
    }

    // Check if password_hash exists
    if (!user.metadata.password_hash) {
      console.error('User missing password_hash:', user.id);
      return redirect('/login?error=Account not properly configured');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.metadata.password_hash);

    if (!isValid) {
      return redirect('/login?error=Invalid email or password');
    }

    // Check if user has a seller profile
    let sellerProfile = null;
    const isSeller = user.metadata.is_seller || false;

    if (isSeller) {
      try {
        const sellerResult = await cosmic.objects
          .findOne({
            type: 'sellers',
            'metadata.user_id': user.id
          })
          .props('id,slug,title,metadata');

        sellerProfile = sellerResult.object;
      } catch (error) {
        console.error('Could not fetch seller profile:', error);
      }
    }

    // Create session
    const sessionToken = createSessionToken();
    const session: any = {
      userId: user.id,
      email: user.metadata.email,
      name: user.metadata.name || user.title || 'User',
      isSeller: isSeller
    };

    // Add seller info if they have a profile
    if (sellerProfile) {
      session.sellerId = sellerProfile.id;
      session.businessName = sellerProfile.metadata.business_name;
    }

    console.log('Login successful:', { 
      email, 
      userId: user.id,
      name: session.name,
      isSeller: session.isSeller,
      sellerId: session.sellerId 
    });

    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken, session);

    // Redirect to dashboard if seller, otherwise profile
    if (isSeller && sellerProfile) {
      return redirect('/dashboard');
    }

    return redirect('/profile');
  } catch (error) {
    console.error('Login error:', error);
    return redirect('/login?error=Failed to login');
  }
};