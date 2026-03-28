// src/pages/api/seller/balance.ts
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
    const balance = await stripe.balance.retrieve({ stripeAccount: acctId });
    const avail   = balance.available.find(b => b.currency === 'usd') ?? balance.available[0];
    const pending = balance.pending.find(b  => b.currency === 'usd') ?? balance.pending[0];
    return new Response(JSON.stringify({
      available: (avail?.amount  ?? 0) / 100,
      pending:   (pending?.amount ?? 0) / 100,
      currency:  (avail?.currency ?? 'usd').toUpperCase(),
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
