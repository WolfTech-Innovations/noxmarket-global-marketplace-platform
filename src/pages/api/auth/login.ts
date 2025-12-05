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

    // Get user from Cosmic (checks both users and sellers)
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

    // Determine user type
    let userType = user.metadata.user_type || 'buyer';
    
    // If the user object itself is type 'sellers', they're a seller
    if (user.type === 'sellers') {
      userType = 'seller';
    }

    // Create session with appropriate data
    const sessionToken = createSessionToken();
    const session: any = {
      userId: user.id,
      email: user.metadata.email,
      userType: userType,
      name: user.metadata.name || user.title || 'User',
    };

    // If seller, fetch their seller profile
    if (userType === 'seller') {
      try {
        // First, check if this IS the seller profile (old style)
        if (user.type === 'sellers') {
          session.sellerId = user.id;
          session.businessName = user.metadata.business_name || user.title;
        } else {
          // New style: separate user and seller profile
          const sellerProfile = await cosmic.objects
            .findOne({
              type: 'sellers',
              'metadata.user_id': user.id
            })
            .props('id,slug,title,metadata');

          if (sellerProfile.object) {
            session.sellerId = sellerProfile.object.id;
            session.businessName = sellerProfile.object.metadata.business_name;
          } else {
            // Fallback: try to find seller by email
            const sellerByEmail = await cosmic.objects
              .find({
                type: 'sellers',
                'metadata.email': email
              })
              .props('id,slug,title,metadata')
              .limit(1);

            if (sellerByEmail.objects && sellerByEmail.objects.length > 0) {
              session.sellerId = sellerByEmail.objects[0].id;
              session.businessName = sellerByEmail.objects[0].metadata.business_name;
            }
          }
        }
      } catch (error) {
        console.error('Could not fetch seller profile:', error);
      }
    }

    console.log('Login successful:', { 
      email, 
      userType, 
      userId: user.id,
      name: session.name,
      sellerId: session.sellerId 
    });

    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken, session);

    // Redirect based on user type
    if (userType === 'seller') {
      return redirect('/dashboard');
    }

    return redirect('/profile');
  } catch (error) {
    console.error('Login error:', error);
    return redirect('/login?error=Failed to login');
  }
};