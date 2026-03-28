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
    const link = await stripe.accounts.createLoginLink(acctId);
    return new Response(JSON.stringify({ url: link.url }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
