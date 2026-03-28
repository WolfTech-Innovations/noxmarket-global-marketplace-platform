// src/pages/api/seller/express-link.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSessionFromCookies } from '@/lib/auth';
import { getStripeAccountId } from '@/lib/seller';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSessionFromCookies(cookies);
  if (!session?.sellerId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const acctId = await getStripeAccountId(session.sellerId);
  if (!acctId) return new Response(JSON.stringify({ error: 'No Stripe account linked' }), { status: 400 });

  try {
    const account = await stripe.accounts.retrieve(acctId);
    const fullyOnboarded = account.charges_enabled && account.payouts_enabled;

    let url: string;
    if (fullyOnboarded) {
      const link = await stripe.accounts.createLoginLink(acctId);
      url = link.url;
    } else {
      const link = await stripe.accountLinks.create({
        account: acctId,
        refresh_url: 'https://nox.lebnix.org/seller/dashboard',
        return_url: 'https://nox.lebnix.org/seller/dashboard',
        type: 'account_onboarding',
      });
      url = link.url;
    }

    return new Response(JSON.stringify({ url, fullyOnboarded }), { status: 200 });
  } catch (e: any) {
    console.error('Stripe error:', e.type, e.message, e.code);
    return new Response(JSON.stringify({ error: e.message, code: e.code }), { status: 500 });
  }
};