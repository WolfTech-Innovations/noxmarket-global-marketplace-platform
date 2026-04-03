// src/pages/api/seller/notify-ship.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

export const POST: APIRoute = async ({ request }) => {
  let body: { sessionId: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) return new Response(JSON.stringify({ error: 'Missing sessionId' }), { status: 400 });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Stripe session not found' }), { status: 404 });
  }

  const items      = session.line_items?.data ?? [];
  const buyerName  = session.customer_details?.name  ?? 'A buyer';
  const buyerEmail = session.customer_details?.email ?? '';
  const total      = ((session.amount_total ?? 0) / 100).toFixed(2);
  const currency   = (session.currency ?? 'usd').toUpperCase();

  const shippingAddr = session.shipping_details?.address;
  const shippingName = session.shipping_details?.name ?? buyerName;

  const shippingFormatted = shippingAddr
    ? [
        shippingName,
        shippingAddr.line1,
        shippingAddr.line2,
        `${shippingAddr.city}, ${shippingAddr.state} ${shippingAddr.postal_code}`,
        shippingAddr.country
      ].filter(Boolean).join('\n')
    : 'No address provided';

  const firstProduct = items[0]?.price?.product;
  const sellerId: string =
    typeof firstProduct === 'object' && firstProduct !== null
      ? (firstProduct as Stripe.Product).metadata?.seller_id ?? 'unknown'
      : 'unknown';

  const itemSummary = items
    .map(li => {
      const name = typeof li.price?.product === 'object' && li.price.product !== null
        ? (li.price.product as Stripe.Product).name
        : 'Component';
      return `${name} ×${li.quantity ?? 1}`;
    })
    .join(', ');

  const BUCKET = import.meta.env.COSMIC_BUCKET_SLUG;
  const KEY    = import.meta.env.COSMIC_WRITE_KEY;
  const slug   = `ship-${sessionId.slice(-12)}-${Date.now()}`;

  const res = await fetch(`https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      title:  `Ship to ${buyerName}`,
      type:   'ship-notifications',
      slug,
      status: 'published',
      metadata: {
        seller_id:        sellerId,
        buyer_name:       buyerName,
        buyer_email:      buyerEmail,
        shipping_address: shippingFormatted,
        items:            itemSummary,
        total:            `${currency} $${total}`,
        stripe_session:   sessionId,
        shipped:          false,
        created_at:       new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return new Response(JSON.stringify({ error: err.message ?? 'Cosmic write failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};