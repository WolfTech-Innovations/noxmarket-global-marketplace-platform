import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';
import Stripe from 'stripe';
import { cosmic } from '@/lib/cosmic';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);

  if (!session || !session.isSeller || !session.sellerId) {
    return redirect('/login');
  }

  try {
    const baseUrl = new URL(request.url).origin;

    // Check if seller already has a Stripe account
    const sellerProfile = await cosmic.objects.findOne({
      id: session.sellerId,
    });

    let stripeAccountId = sellerProfile?.object?.metadata?.stripe_account_id;

    // If no Stripe account exists, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: session.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          seller_id: session.sellerId,
          user_id: session.userId,
        },
      });

      stripeAccountId = account.id;
      console.log('Stripe Connect account created:', stripeAccountId);

      // Save the Stripe account ID
      await cosmic.objects.updateOne(session.sellerId, {
        metadata: {
          stripe_account_id: stripeAccountId,
          stripe_onboarding_complete: false,
        }
      });
    } else {
      console.log('Using existing Stripe account:', stripeAccountId);
    }

    // Create an account link for onboarding (includes identity verification)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/settings?refresh=true`,
      return_url: `${baseUrl}/dashboard/settings?success=true`,
      type: 'account_onboarding',
    });

    console.log('Redirecting to Stripe onboarding:', accountLink.url);

    // Redirect to Stripe's hosted onboarding
    return redirect(accountLink.url);

  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return redirect('/dashboard/settings?error=Failed to start verification process');
  }
};