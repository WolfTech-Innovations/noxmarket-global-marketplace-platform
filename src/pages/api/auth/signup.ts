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

    console.log('Signup attempt:', { name, email });

    if (!name || !email || !password) {
      return redirect('/signup?error=Missing required fields');
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return redirect('/signup?error=Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create a single user account - they can buy and sell
    const userData = {
      type: 'users',
      title: name,
      slug: `user-${nanoid(10)}`,
      metadata: {
        name,
        email,
        password_hash: passwordHash,
        is_seller: false, // Can be upgraded to seller later
        created_at: new Date().toISOString()
      }
    };

    console.log('Creating user account:', { name, email });
    const user = await createUser(userData);
    console.log('User account created:', user.id);

    // Create session
    const sessionToken = createSessionToken();
    const session: any = {
      userId: user.id,
      email: user.metadata.email,
      name: user.metadata.name || name,
      isSeller: false
    };

    console.log('Session created:', { userId: user.id, name: session.name });

    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken, session);

    // Redirect to profile
    return redirect('/profile');
  } catch (error) {
    console.error('Signup error:', error);
    return redirect('/signup?error=Failed to create account');
  }
};