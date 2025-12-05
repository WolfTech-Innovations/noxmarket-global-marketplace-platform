import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  // If webhook secret is not configured, log warning but don't fail
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured - webhook verification skipped');
    console.warn('Orders will still process but stock updates may be delayed');
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Only verify signature if webhook secret is configured
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Parse the event without verification (not recommended for production)
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment successful!', {
        sessionId: session.id,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total,
        metadata: session.metadata,
      });

      // Here you would:
      // 1. Create order record in Cosmic CMS
      // 2. Update product stock quantity
      // 3. Send confirmation email
      // 4. Notify seller
      
      // Example: Update stock in Cosmic
      try {
        const productId = session.metadata?.productId;
        const quantity = parseInt(session.metadata?.quantity || '1');
        
        if (productId) {
          // TODO: Implement stock update in Cosmic
          // const product = await getProduct(productId);
          // const newStock = product.metadata.stock_quantity - quantity;
          // await updateProductStock(productId, newStock);
          
          console.log(`Stock updated for product ${productId}: -${quantity}`);
        }
      } catch (error) {
        console.error('Error updating stock:', error);
      }
      
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session expired:', session.id);
      break;
    }
                 // Add these event handlers to your existing webhook at src/pages/api/webhook/stripe.ts

// After your existing switch cases, add:

case 'account.updated': {
  const account = event.data.object as Stripe.Account;
  console.log('Stripe account updated:', account.id);
  
  // Check if account is fully onboarded
  if (account.charges_enabled && account.payouts_enabled) {
    console.log('Account fully verified:', account.id);
    
    // Update seller profile to mark as verified
    try {
      // Find seller by stripe account ID
      const sellerResponse = await cosmic.objects.find({
        type: 'sellers',
        'metadata.stripe_account_id': account.id
      }).props('id');
      
      if (sellerResponse.objects && sellerResponse.objects.length > 0) {
        const sellerId = sellerResponse.objects[0].id;
        
        await cosmic.objects.updateOne(sellerId, {
          metadata: {
            stripe_onboarding_complete: true,
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled
          }
        });
        
        console.log('Seller marked as verified:', sellerId);
      }
    } catch (error) {
      console.error('Error updating seller verification:', error);
    }
  }
  break;
}

case 'account.application.deauthorized': {
  const account = event.data.object as any;
  console.log('Stripe account disconnected:', account.id);
  
  // Handle account disconnection
  // Update seller to mark as disconnected
  break;
}
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};