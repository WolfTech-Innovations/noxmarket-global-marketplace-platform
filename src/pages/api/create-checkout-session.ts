// src/pages/api/create-checkout-session.ts
import type { APIRoute } from 'astro';
import { stripe } from '@/lib/stripe';
import { cosmic } from '@/lib/cosmic';
import { getSessionFromCookies } from '@/lib/auth';
import type { Product } from '@/types';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSessionFromCookies(cookies);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const productId = formData.get('productId') as string;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch product
    const response = await cosmic.objects.findOne({
      type: 'products',
      id: productId
    });

    const product = response.object as Product;

    if (!product || !product.metadata.in_stock) {
      return new Response(JSON.stringify({ error: 'Product not available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const price = product.metadata.price || 0;

    // Fetch seller separately to get full metadata including stripe_account_id
    const sellerId = product.metadata.seller?.id;
    let stripeAccountId: string | undefined;

    if (sellerId) {
      try {
        const sellerResponse = await cosmic.objects.findOne({
          type: 'sellers',
          id: sellerId
        });
        stripeAccountId = sellerResponse.object?.metadata?.stripe_account_id;
      } catch {
        console.error('Failed to fetch seller:', sellerId);
      }
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.metadata.product_name,
              description: product.metadata.description?.substring(0, 200) || '',
              images: product.metadata.product_images?.[0]?.imgix_url
                ? [`${product.metadata.product_images[0].imgix_url}?w=500&h=500&fit=crop`]
                : []
            },
            unit_amount: Math.round(price * 100)
          },
          quantity: 1
        }
      ],
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

      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/checkout/${productId}`,

      ...(stripeAccountId && {
        payment_intent_data: {
          application_fee_amount: Math.round(price * 100 * 0.06), // 6% platform fee
          transfer_data: {
            destination: stripeAccountId
          }
        }
      })
    });

    return new Response(null, {
      status: 303,
      headers: {
        'Location': checkoutSession.url || '/'
      }
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
