// src/pages/api/webhook/stripe.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createBucketClient } from '@cosmicjs/sdk';

// Initialize Stripe with type-safe environment variable
const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

// Initialize Cosmic
const cosmic = createBucketClient({
  bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG || '',
  readKey: import.meta.env.COSMIC_READ_KEY || '',
  writeKey: import.meta.env.COSMIC_WRITE_KEY || '',
});

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('No signature', { status: 400 });
  }

  if (!endpointSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`Webhook signature verification failed:`, errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Retrieve full session with line items expanded
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product']
        });

        // Get the seller ID from metadata
        const sellerId = session.metadata?.sellerId;
        const productId = session.metadata?.productId;

        if (sellerId) {
          // Generate order number
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

          // Prepare order data matching your dashboard structure
          const orderData = {
            // Order identifiers
            order_id: fullSession.id,
            order_number: orderNumber,
            seller_id: sellerId,
            product_id: productId,
            order_status: 'pending',
            
            // Customer/Buyer details
            buyer_name: fullSession.customer_details?.name || '',
            buyer_email: fullSession.customer_details?.email || '',
            
            // Shipping details
            shipping_name: fullSession.shipping_details?.name || '',
            shipping_address: fullSession.shipping_details?.address ? {
              line1: fullSession.shipping_details.address.line1,
              line2: fullSession.shipping_details.address.line2,
              city: fullSession.shipping_details.address.city,
              state: fullSession.shipping_details.address.state,
              postal_code: fullSession.shipping_details.address.postal_code,
              country: fullSession.shipping_details.address.country
            } : null,
            
            // Order items
            line_items: fullSession.line_items?.data.map(item => ({
              product_name: (item.price?.product as Stripe.Product)?.name || 'Unknown Product',
              product_id: typeof item.price?.product === 'string' ? item.price.product : (item.price?.product as Stripe.Product)?.id,
              quantity: item.quantity,
              amount: item.amount_total,
              currency: item.currency
            })) || [],
            
            // Payment details
            order_total: (fullSession.amount_total || 0) / 100, // Convert from cents to dollars
            amount_total: fullSession.amount_total || 0, // Keep in cents for Stripe compatibility
            amount_subtotal: fullSession.amount_subtotal || 0,
            currency: fullSession.currency || 'usd',
            payment_status: fullSession.payment_status === 'paid' ? 'paid' : 'unpaid',
            
            // Timestamps
            created_at: new Date().toISOString(),
            paid_at: new Date(session.created * 1000).toISOString(),
            order_date: new Date().toISOString()
          };

          // Create order in Cosmic CMS
          try {
            await cosmic.objects.insertOne({
              title: `Order ${fullSession.id}`,
              type: 'orders',
              metadata: orderData
            });
            
            console.log(`Created order ${fullSession.id} for seller ${sellerId}`);
          } catch (cosmicError) {
            console.error('Failed to create order in Cosmic:', cosmicError);
          }

          // Update seller's earnings in Cosmic
          const sellerResponse = await cosmic.objects.find({
            type: 'sellers',
            'metadata.user_id': sellerId
          });

          if (sellerResponse.objects && sellerResponse.objects.length > 0) {
            const seller = sellerResponse.objects[0];
            const currentEarnings = seller.metadata?.total_earnings || 0;
            const sessionAmount = session.amount_total || 0;
            const platformFee = sessionAmount * 0.1; // 10% platform fee
            const sellerEarnings = (sessionAmount - platformFee) / 100; // Convert from cents
            const newEarnings = currentEarnings + sellerEarnings;

            await cosmic.objects.updateOne(seller.id, {
              metadata: {
                ...seller.metadata,
                total_earnings: newEarnings,
                total_orders: (seller.metadata?.total_orders || 0) + 1
              }
            });

            console.log(`Updated seller ${sellerId} earnings to $${newEarnings}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error processing webhook:', errorMessage);
    return new Response(`Webhook processing error: ${errorMessage}`, { status: 500 });
  }
};