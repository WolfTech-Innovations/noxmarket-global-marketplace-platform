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
    const sellerId = formData.get('sellerId') as string;

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
    const seller = product.metadata.seller;
    const stripeAccountId = seller?.metadata?.stripe_account_id;

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
            unit_amount: Math.round(price * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      
      // Collect shipping address
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI']
      },
      
      // Store metadata for webhook
      metadata: {
        productId: product.id,
        sellerId: seller?.id || '',
        buyerEmail: session.email,
        buyerName: session.name
      },

      // Success and cancel URLs
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/checkout/${productId}`,

      // If seller has Stripe Connect account, use payment intent data for split payment
      ...(stripeAccountId && {
        payment_intent_data: {
          application_fee_amount: Math.round(price * 100 * 0.1), // 10% platform fee
          transfer_data: {
            destination: stripeAccountId
          }
        }
      })
    });

    // Redirect to Stripe Checkout
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