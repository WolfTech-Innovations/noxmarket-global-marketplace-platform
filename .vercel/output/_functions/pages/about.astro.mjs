/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "About Us - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-3xl mx-auto"> <h1 class="text-4xl font-bold mb-6">About NoxMarket</h1> <div class="prose prose-lg"> <p>
NoxMarket is a global marketplace platform powered by WolfTech Innovations, 
            connecting sellers and buyers from around the world in a seamless e-commerce experience.
</p> <h2>Our Mission</h2> <p>
To provide a secure, efficient, and user-friendly platform where sellers can 
            showcase their products and buyers can discover unique items from around the globe.
</p> <h2>Why Choose NoxMarket?</h2> <ul> <li>Secure payment processing powered by Stripe</li> <li>Easy seller onboarding with Stripe Connect</li> <li>Comprehensive seller dashboard for managing products and orders</li> <li>Advanced search and filtering capabilities</li> <li>Modern, responsive design optimized for all devices</li> </ul> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/about.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
