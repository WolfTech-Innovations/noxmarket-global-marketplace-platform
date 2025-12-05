/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
export { renderers } from '../renderers.mjs';

const $$Terms = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Terms of Service - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-3xl mx-auto"> <h1 class="text-4xl font-bold mb-6">Terms of Service</h1> <div class="prose prose-lg"> <p class="text-sm text-gray-600">Last updated: December 2024</p> <h2>1. Acceptance of Terms</h2> <p>
By accessing and using NoxMarket, you accept and agree to be bound by the terms 
            and provision of this agreement.
</p> <h2>2. User Accounts</h2> <p>
You are responsible for maintaining the confidentiality of your account and password 
            and for restricting access to your computer.
</p> <h2>3. Seller Responsibilities</h2> <p>
Sellers must provide accurate product information, fulfill orders promptly, and 
            comply with all applicable laws and regulations.
</p> <h2>4. Buyer Responsibilities</h2> <p>
Buyers must provide accurate shipping information and make timely payments for 
            their purchases.
</p> <h2>5. Payments and Fees</h2> <p>
All payments are processed securely through Stripe. Platform fees and seller 
            payouts are handled according to our fee structure.
</p> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/terms.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
