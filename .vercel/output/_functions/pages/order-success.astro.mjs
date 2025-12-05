/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import Stripe from 'stripe';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$OrderSuccess = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$OrderSuccess;
  const stripe = new Stripe(undefined                                 , {
    apiVersion: "2025-02-24.acacia"
  });
  const sessionId = Astro2.url.searchParams.get("session_id");
  let orderDetails = null;
  let error = null;
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "customer"]
      });
      orderDetails = {
        id: session.id,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || "USD",
        status: session.payment_status,
        items: session.line_items?.data || []
      };
    } catch (err) {
      console.error("Error retrieving session:", err);
      error = "Could not retrieve order details";
    }
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Order Successful - NoxMarket", "description": "Thank you for your purchase!" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12 md:py-20"> <div class="container-custom max-w-2xl"> ${orderDetails ? renderTemplate`<div class="text-center animate-fade-in"> <!-- Success Icon --> <div class="mb-6 flex justify-center"> <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"> <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path> </svg> </div> </div> <!-- Success Message --> <h1 class="text-3xl md:text-4xl font-bold mb-4">
Order Successful! 🎉
</h1> <p class="text-lg text-gray-600 mb-8">
Thank you for your purchase. We've sent a confirmation email to <strong>${orderDetails.customerEmail}</strong> </p> <!-- Order Summary Card --> <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 text-left"> <h2 class="text-xl font-bold mb-6 pb-4 border-b border-gray-200">Order Summary</h2> <div class="space-y-4 mb-6"> <div class="flex justify-between items-center"> <span class="text-gray-600">Order ID:</span> <span class="font-mono text-sm">${orderDetails.id.substring(0, 20)}...</span> </div> <div class="flex justify-between items-center"> <span class="text-gray-600">Payment Status:</span> <span class="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"> ${orderDetails.status === "paid" ? "Paid" : orderDetails.status} </span> </div> </div> <!-- Order Items --> <div class="border-t border-gray-200 pt-6"> <h3 class="font-semibold mb-4">Items Ordered:</h3> <div class="space-y-3"> ${orderDetails.items.map((item) => renderTemplate`<div class="flex justify-between items-center"> <div> <p class="font-medium">${item.description}</p> <p class="text-sm text-gray-500">Quantity: ${item.quantity}</p> </div> <p class="font-semibold">
$${((item.amount_total || 0) / 100).toFixed(2)} </p> </div>`)} </div> </div> <!-- Total --> <div class="border-t border-gray-200 mt-6 pt-6"> <div class="flex justify-between items-center"> <span class="text-xl font-bold">Total Paid:</span> <span class="text-2xl font-bold text-accent">
$${orderDetails.amount.toFixed(2)} ${orderDetails.currency} </span> </div> </div> </div> <!-- Action Buttons --> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="/products" class="btn btn-primary px-8 py-3">
Continue Shopping
</a> <a href="/" class="btn bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3">
Back to Home
</a> </div> </div>` : renderTemplate`<div class="text-center"> ${error ? renderTemplate`<div class="bg-red-50 border border-red-200 rounded-xl p-8"> <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <h1 class="text-2xl font-bold text-red-900 mb-2">Error</h1> <p class="text-red-700">${error}</p> <a href="/products" class="btn btn-primary mt-6 inline-block">
Return to Products
</a> </div>` : renderTemplate`<div class="bg-gray-50 border border-gray-200 rounded-xl p-8"> <h1 class="text-2xl font-bold mb-2">No Order Found</h1> <p class="text-gray-600 mb-6">We couldn't find your order details.</p> <a href="/products" class="btn btn-primary inline-block">
Return to Products
</a> </div>`} </div>`} </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/order-success.astro", void 0);
const $$file = "/vercel/sandbox/primary/src/pages/order-success.astro";
const $$url = "/order-success";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$OrderSuccess,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
