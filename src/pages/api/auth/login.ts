import type { APIRoute } from 'astro';
import { getUserByEmail } from '@/lib/cosmic';
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

    // Determine user type and build session
    const userType = user.metadata.user_type || 'buyer';
    
    // Create session with appropriate data
    const sessionToken = createSessionToken();
    const session: any = {
      userId: user.id,
      email: user.metadata.email,
      userType: userType,
    };

    // Add name based on user type
    if (userType === 'seller') {
      session.name = user.metadata.business_name || user.title || 'Seller';
      session.sellerId = user.id; // The seller object ID is the seller ID
      session.businessName = user.metadata.business_name;
    } else {
      session.name = user.metadata.name || user.title || 'User';
    }

    console.log('Login successful:', { 
      email, 
      userType, 
      userId: user.id,
      name: session.name 
    });

    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken);

    // Redirect based on user type
    if (userType === 'seller') {
      return redirect('/seller/dashboard');
    }
    
    return redirect('/profile');
  } catch (error) {
    console.error('Login error:', error);
    return redirect('/login?error=Failed to login');
  }
};