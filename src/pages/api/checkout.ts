import type { APIRoute } from 'astro';
import { getProduct } from '@/lib/cosmic';
import { getSessionFromCookies } from '@/lib/auth';

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
    
    // In a real implementation, this would:
    // 1. Create a Stripe payment intent
    // 2. Redirect to Stripe checkout
    // 3. Handle webhook for successful payment
    // 4. Create order in Cosmic
    
    // For now, redirect to a checkout page
    return redirect(`/checkout?product=${product.id}&quantity=${quantity}`);
  } catch (error) {
    console.error('Checkout error:', error);
    return redirect('/products?error=Checkout failed');
  }
};