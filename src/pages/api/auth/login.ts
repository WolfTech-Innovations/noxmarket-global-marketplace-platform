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
    
    // Verify password
    const isValid = await verifyPassword(password, user.metadata.password_hash);
    
    if (!isValid) {
      return redirect('/login?error=Invalid email or password');
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
    console.error('Login error:', error);
    return redirect('/login?error=Failed to login');
  }
};