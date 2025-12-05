// src/pages/api/webhook/stripe.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createBucketClient } from '@cosmicjs/sdk';

// Initialize Stripe with type-safe environment variable
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia', // Use latest or your preferred version
});

// Initialize Cosmic
const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG || '',
  readKey: process.env.COSMIC_READ_KEY || '',
  writeKey: process.env.COSMIC_WRITE_KEY || '',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

        // Get the seller ID from metadata
        const sellerId = session.metadata?.sellerId;
        
        if (sellerId) {
          // Update seller's earnings in Cosmic
          const sellerResponse = await cosmic.objects.find({
            type: 'sellers',
            'metadata.user_id': sellerId
          });

          if (sellerResponse.objects && sellerResponse.objects.length > 0) {
            const seller = sellerResponse.objects[0];
            const currentEarnings = seller.metadata?.total_earnings || 0;
            const sessionAmount = session.amount_total || 0;
            const newEarnings = currentEarnings + (sessionAmount / 100); // Convert from cents

            await cosmic.objects.updateOne(seller.id, {
              metadata: {
                ...seller.metadata,
                total_earnings: newEarnings
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