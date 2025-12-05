/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
export { renderers } from '../renderers.mjs';

const $$Privacy = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Privacy Policy - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-3xl mx-auto"> <h1 class="text-4xl font-bold mb-6">Privacy Policy</h1> <div class="prose prose-lg"> <p class="text-sm text-gray-600">Last updated: December 2024</p> <h2>1. Information We Collect</h2> <p>
We collect information you provide directly to us, including name, email address, 
            and payment information for processing transactions.
</p> <h2>2. How We Use Your Information</h2> <p>
We use the information we collect to provide, maintain, and improve our services, 
            process transactions, and communicate with you.
</p> <h2>3. Information Sharing</h2> <p>
We do not sell your personal information. We may share your information with 
            service providers who assist us in operating our platform.
</p> <h2>4. Data Security</h2> <p>
We implement appropriate technical and organizational measures to protect your 
            personal information against unauthorized access or disclosure.
</p> <h2>5. Your Rights</h2> <p>
You have the right to access, correct, or delete your personal information at any time.
</p> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/privacy.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/privacy.astro";
const $$url = "/privacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Privacy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
