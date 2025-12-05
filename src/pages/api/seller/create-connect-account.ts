import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';
import Stripe from 'stripe';
import { cosmic } from '@/lib/cosmic';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);

  if (!session || session.userType !== 'seller' || !session.sellerId) {
    return redirect('/login');
  }

  try {
    const baseUrl = new URL(request.url).origin;

    // Create a Stripe Connect account for the seller
    const account = await stripe.accounts.create({
      type: 'express', // or 'standard' for more control
      country: 'US', // Get from form or default
      email: session.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // or 'company'
      metadata: {
        seller_id: session.sellerId,
        user_id: session.userId,
      },
    });

    console.log('Stripe Connect account created:', account.id);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/dashboard/settings?refresh=true`,
      return_url: `${baseUrl}/dashboard/settings?success=true`,
      type: 'account_onboarding',
    });

    // Save the Stripe account ID to the seller profile
    await cosmic.objects.updateOne(session.sellerId, {
      metadata: {
        stripe_account_id: account.id,
        stripe_onboarding_complete: false,
      }
    });

    console.log('Redirecting to Stripe onboarding:', accountLink.url);

    // Redirect to Stripe's hosted onboarding
    return redirect(accountLink.url);

  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return redirect('/dashboard/settings?error=Failed to start verification process');
  }
};