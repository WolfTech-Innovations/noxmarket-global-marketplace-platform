---
import Layout from '@/layouts/Layout.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import { getSessionFromCookies } from '@/lib/auth';
import { cosmic } from '@/lib/cosmic';

const session = getSessionFromCookies(Astro.cookies);

if (!session) {
  return Astro.redirect('/login');
}

const { productId } = Astro.params;

// Get product details
const product = await cosmic.objects.findOne({
  type: 'products',
  id: productId
}).props('id,title,metadata').depth(1);

if (!product.object) {
  return Astro.redirect('/products?error=Product not found');
}

const productData = product.object;
---

<Layout title={`Checkout - ${productData.metadata.product_name}`}>
  <Header />

  <main class="py-16 bg-gray-50 min-h-screen">
    <div class="container-custom max-w-6xl">
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Left: Order Summary -->
        <div class="card-elevated p-8">
          <h2 class="text-2xl font-medium text-gray-900 mb-6">Order Summary</h2>
          
          <div class="space-y-6">
            <!-- Product -->
            <div class="flex gap-4">
              {productData.metadata.product_images?.[0] ? (
                <img 
                  src={productData.metadata.product_images[0].imgix_url || productData.metadata.product_images[0].url}
                  alt={productData.metadata.product_name}
                  class="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div class="w-24 h-24 bg-gray-100 rounded-lg"></div>
              )}
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{productData.metadata.product_name}</h3>
                <p class="text-sm text-gray-600 line-clamp-2">{productData.metadata.description}</p>
                <p class="text-lg font-bold text-gray-900 mt-2">${productData.metadata.price.toFixed(2)}</p>
              </div>
            </div>

            <!-- Shipping Form -->
            <form id="shipping-form" class="space-y-4">
              <div>
                <label for="shipping_address" class="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  rows="3"
                  class="input w-full"
                  placeholder="123 Main St, Apt 4B&#10;City, ST 12345"
                  required
                ></textarea>
              </div>

              <div>
                <label for="buyer_phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="buyer_phone"
                  name="buyer_phone"
                  class="input w-full"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </form>

            <!-- Total -->
            <div class="border-t pt-4">
              <div class="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${productData.metadata.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Embedded Stripe Checkout -->
        <div class="card-elevated p-8">
          <h2 class="text-2xl font-medium text-gray-900 mb-6">Payment</h2>
          
          <!-- Loading state -->
          <div id="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Preparing checkout...</p>
          </div>

          <!-- Stripe Embedded Checkout -->
          <div id="checkout"></div>

          <!-- Error state -->
          <div id="error" class="hidden p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p class="text-red-800 font-medium">Payment failed. Please try again.</p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <Footer />

  <script is:inline src="https://js.stripe.com/v3/"></script>
  <script is:inline define:vars={{ productId, stripeKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY }}>
    const stripe = Stripe(stripeKey);
    let checkout;

    async function initialize() {
      const shippingAddress = document.getElementById('shipping_address').value;
      const buyerPhone = document.getElementById('buyer_phone').value;

      if (!shippingAddress) {
        alert('Please enter your shipping address');
        return;
      }

      document.getElementById('loading').classList.remove('hidden');
      document.getElementById('error').classList.add('hidden');

      try {
        // Create checkout session
        const response = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId,
            shippingAddress: shippingAddress,
            buyerPhone: buyerPhone
          })
        });

        const { clientSecret, orderId } = await response.json();

        // Mount embedded checkout
        checkout = await stripe.initEmbeddedCheckout({
          clientSecret: clientSecret,
          onComplete: () => {
            // Payment successful - redirect to success page
            window.location.href = `/checkout/success?order=${orderId}`;
          }
        });

        checkout.mount('#checkout');
        document.getElementById('loading').classList.add('hidden');

      } catch (error) {
        console.error('Checkout error:', error);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
      }
    }

    // Auto-initialize when shipping address is filled
    document.getElementById('shipping_address').addEventListener('blur', () => {
      if (!checkout && document.getElementById('shipping_address').value) {
        initialize();
      }
    });
  </script>
</Layout>