// src/pages/api/seller/withdraw.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSessionFromCookies } from '@/lib/auth';
import { getStripeAccountId } from '@/lib/seller';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

export const POST: APIRoute = async ({ cookies, request }) => {
  const session = getSessionFromCookies(cookies);
  if (!session?.sellerId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const acctId = await getStripeAccountId(session.sellerId);
  if (!acctId) return new Response(JSON.stringify({ error: 'No Stripe account linked' }), { status: 400 });

  let amount: number;
  try {
    const body = await request.json();
    amount = Math.round(Number(body.amount) * 100);
    if (!amount || amount <= 0) throw new Error();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
  }

  try {
    const payout = await stripe.payouts.create(
      { amount, currency: 'usd', description: 'Nox seller withdrawal' },
      { stripeAccount: acctId }
    );
    return new Response(JSON.stringify({ ok: true, id: payout.id, status: payout.status }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
