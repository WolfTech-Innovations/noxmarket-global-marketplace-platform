import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSessionFromCookies } from '@/lib/auth';
import { cosmic } from '@/lib/cosmic';
import { nanoid } from 'nanoid';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSessionFromCookies(cookies);

  if (!session || !session.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { productId, shippingAddress, buyerPhone } = body;

    if (!productId || !shippingAddress) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get product details
    const product = await cosmic.objects.findOne({
      type: 'products',
      id: productId
    }).props('id,title,metadata').depth(1);

    if (!product.object || !product.object.metadata.in_stock) {
      return new Response(JSON.stringify({ error: 'Product unavailable' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const productData = product.object;
    const sellerId = typeof productData.metadata.seller === 'string' 
      ? productData.metadata.seller 
      : productData.metadata.seller?.id;

    // Generate order number
    const orderNumber = `NOX-${Date.now()}-${nanoid(6).toUpperCase()}`;

    // Create Stripe Checkout Session (Embedded mode)
    const checkoutSession = await stripe.checkout.sessions.create({
      ui_mode: 'embedded', // This makes it embedded!
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productData.metadata.product_name,
              description: productData.metadata.description,
              images: productData.metadata.product_images?.map((img: any) => img.url) || [],
            },
            unit_amount: Math.round(productData.metadata.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: session.email,
      return_url: `${new URL(request.url).origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        order_number: orderNumber,
        product_id: productId,
        seller_id: sellerId,
        buyer_id: session.userId,
        buyer_name: session.name,
        buyer_email: session.email,
        buyer_phone: buyerPhone || '',
        shipping_address: shippingAddress,
      },
    });

    // Create pending order in Cosmic
    const orderData = {
      type: 'orders',
      title: `Order ${orderNumber}`,
      slug: `order-${nanoid(10)}`,
      metadata: {
        order_number: orderNumber,
        product: productId,
        seller: sellerId,
        buyer_id: session.userId,
        buyer_name: session.name,
        buyer_email: session.email,
        buyer_phone: buyerPhone || '',
        shipping_address: shippingAddress,
        order_total: productData.metadata.price,
        order_status: 'pending',
        payment_status: 'pending',
        stripe_session_id: checkoutSession.id,
        tracking_number: '',
        carrier: '',
        warranty_expires: '',
        notes: ''
      }
    };

    await cosmic.objects.insertOne(orderData);

    // Return client secret for embedded checkout
    return new Response(JSON.stringify({ 
      clientSecret: checkoutSession.client_secret,
      orderId: orderNumber
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};