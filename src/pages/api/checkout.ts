import type { APIRoute } from 'astro';
import { getProduct } from '@/lib/cosmic';
import { getSessionFromCookies } from '@/lib/auth';
import Stripe from 'stripe';

// Initialize Stripe with your live secret key
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);

  if (!session) {
    return redirect('/login');
  }

  try {
    const formData = await request.formData();
    const productId = formData.get('productId')?.toString();
    const quantity = parseInt(formData.get('quantity')?.toString() || '1');

    if (!productId) {
      return redirect('/products?error=Invalid product');
    }

    const product = await getProduct(productId);

    if (!product) {
      return redirect('/products?error=Product not found');
    }

    if (!product.metadata.in_stock) {
      return redirect(`/products/${product.slug}?error=Product out of stock`);
    }

    if (quantity > product.metadata.stock_quantity) {
      return redirect(`/products/${product.slug}?error=Not enough stock available`);
    }

    // Auto-detect the base URL from the request
    const baseUrl = new URL(request.url).origin;

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.metadata.product_name,
              description: product.metadata.description?.substring(0, 500) || '',
              images: product.metadata.product_images?.[0]?.imgix_url 
                ? [`${product.metadata.product_images[0].imgix_url}?w=500&h=500&fit=crop`]
                : [],
            },
            unit_amount: Math.round(product.metadata.price * 100), // Convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/products/${product.slug}?error=Payment cancelled`,
      customer_email: session.email,
      metadata: {
        productId: product.id,
        productSlug: product.slug,
        userId: session.userId,
        quantity: quantity.toString(),
      },
      // Optional: Add shipping address collection
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // Add countries you ship to
      },
    });

    // Redirect to Stripe Checkout
    return redirect(checkoutSession.url!);

  } catch (error) {
    console.error('Checkout error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error.message);
      return redirect('/products?error=Payment system error');
    }
    
    return redirect('/products?error=Checkout failed');
  }
};