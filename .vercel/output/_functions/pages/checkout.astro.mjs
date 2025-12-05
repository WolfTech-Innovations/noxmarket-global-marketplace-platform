/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../chunks/auth_Du1TDwjH.mjs';
import { c as cosmic } from '../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Checkout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Checkout;
  const session = getSessionFromCookies(Astro2.cookies);
  if (!session) {
    return Astro2.redirect("/login");
  }
  const productId = Astro2.url.searchParams.get("product");
  const quantity = parseInt(Astro2.url.searchParams.get("quantity") || "1");
  if (!productId) {
    return Astro2.redirect("/products");
  }
  let product;
  try {
    const response = await cosmic.objects.findOne({ type: "products", id: productId }).depth(1);
    product = response.object;
  } catch (error) {
    return Astro2.redirect("/products");
  }
  const total = product.metadata.price * quantity;
  const image = product.metadata.product_images?.[0];
  const imageUrl = image ? `${image.imgix_url}?w=200&h=200&fit=crop&auto=format,compress` : "";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Checkout - NoxMarket" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <h1 class="text-4xl font-bold mb-8">Checkout</h1> <div class="grid grid-cols-1 lg:grid-cols-3 gap-8"> <div class="lg:col-span-2"> <div class="card p-6"> <h2 class="text-2xl font-bold mb-6">Shipping Information</h2> <form action="/api/process-payment" method="POST" class="space-y-4"> <input type="hidden" name="productId"${addAttribute(product.id, "value")}> <input type="hidden" name="quantity"${addAttribute(quantity, "value")}> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block font-medium mb-2">First Name</label> <input type="text" name="firstName" required class="input"${addAttribute(session.name.split(" ")[0], "value")}> </div> <div> <label class="block font-medium mb-2">Last Name</label> <input type="text" name="lastName" required class="input"${addAttribute(session.name.split(" ").slice(1).join(" "), "value")}> </div> </div> <div> <label class="block font-medium mb-2">Email</label> <input type="email" name="email" required class="input"${addAttribute(session.email, "value")}> </div> <div> <label class="block font-medium mb-2">Phone</label> <input type="tel" name="phone" class="input" placeholder="(555) 123-4567"> </div> <div> <label class="block font-medium mb-2">Shipping Address</label> <textarea name="shippingAddress" required rows="3" class="input" placeholder="Street address, city, state, zip"></textarea> </div> <div class="pt-4"> <h3 class="text-xl font-bold mb-4">Payment Information</h3> <p class="text-sm text-gray-600 mb-4">
This is a demo checkout. In production, this would integrate with Stripe for secure payment processing.
</p> <button type="submit" class="btn btn-primary w-full">
Complete Purchase - $${total.toFixed(2)} </button> </div> </form> </div> </div> <div> <div class="card p-6 sticky top-24"> <h2 class="text-xl font-bold mb-4">Order Summary</h2> <div class="flex items-center gap-4 mb-6"> ${imageUrl && renderTemplate`<img${addAttribute(imageUrl, "src")}${addAttribute(product.metadata.product_name, "alt")} class="w-20 h-20 object-cover rounded-lg" width="80" height="80">`} <div class="flex-1"> <h3 class="font-bold">${product.metadata.product_name}</h3> <p class="text-sm text-gray-600">Quantity: ${quantity}</p> </div> </div> <div class="border-t border-gray-200 pt-4 space-y-2"> <div class="flex justify-between"> <span>Subtotal</span> <span>$${total.toFixed(2)}</span> </div> <div class="flex justify-between"> <span>Shipping</span> <span>$0.00</span> </div> <div class="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"> <span>Total</span> <span>$${total.toFixed(2)}</span> </div> </div> </div> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/checkout.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/checkout.astro";
const $$url = "/checkout";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Checkout,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
