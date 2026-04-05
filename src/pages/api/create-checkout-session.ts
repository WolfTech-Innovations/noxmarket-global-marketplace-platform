import type { APIRoute } from 'astro';
import { stripe } from '@/lib/stripe';
import { cosmic } from '@/lib/cosmic';
import { getSessionFromCookies } from '@/lib/auth';
import type { Product } from '@/types';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSessionFromCookies(cookies);
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    if (!productId) return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const { object: product } = await cosmic.objects.findOne(
  { type: 'products', id: productId, depth: 2 }
) as { object: Product };

    if (!product || !product.metadata.in_stock) return new Response(JSON.stringify({ error: 'Product not available' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const price = product.metadata.price || 0;
    if (price <= 0) return new Response(JSON.stringify({ error: 'Invalid product price' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const unitAmount = Math.round(price * 100);
    const sellerId = product.metadata.seller?.id;
    const stripeAccountId: string | undefined = product.metadata.seller?.metadata?.stripe_account_id;

    const origin = request.headers.get('origin') || '';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.metadata.product_name,
            description: product.metadata.description?.substring(0, 200) || '',
            images: product.metadata.product_images?.[0]?.imgix_url
              ? [`${product.metadata.product_images[0].imgix_url}?w=500&h=500&fit=crop`]
              : []
          },
          unit_amount: unitAmount
        },
        quantity: 1
      }],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI']
      },
      metadata: {
        productId: product.id,
        sellerId: sellerId || '',
        buyerEmail: session.email,
        buyerName: session.name
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${productId}`,
      ...(stripeAccountId && {
        on_behalf_of: stripeAccountId,
        payment_intent_data: {
          application_fee_amount: Math.round(unitAmount * 0.06),
          transfer_data: { destination: stripeAccountId }
        }
      })
    });

    if (!checkoutSession.url) throw new Error('No checkout URL returned from Stripe');

    return new Response(null, { status: 303, headers: { Location: checkoutSession.url } });

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};