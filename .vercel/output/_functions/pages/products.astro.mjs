/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, n as renderScript, h as addAttribute } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { $ as $$ProductCard } from '../chunks/ProductCard_DB932yYr.mjs';
import { f as getProducts, h as getCategories } from '../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const products = await getProducts();
  const categories = await getCategories();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Products - NoxMarket" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="mb-8"> <h1 class="text-4xl font-bold mb-4">All Products</h1> <p class="text-gray-600 text-lg">Discover amazing products from sellers worldwide</p> </div> ${categories.length > 0 && renderTemplate`<div class="mb-8 flex flex-wrap gap-2"> <a href="/products" class="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
All
</a> ${categories.map((category) => renderTemplate`<a${addAttribute(`/products?category=${category.slug}`, "href")} class="px-4 py-2 rounded-full bg-gray-200 text-primary hover:bg-gray-300 text-sm font-medium transition-colors"> ${category.metadata.category_name} </a>`)} </div>`} ${products.length === 0 ? renderTemplate`<div class="text-center py-20"> <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path> </svg> <h2 class="text-2xl font-bold mb-2">No Products Yet</h2> <p class="text-gray-600 mb-6">Be the first to list a product!</p> <a href="/signup?type=seller" class="btn btn-primary">
Become a Seller
</a> </div>` : renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> ${products.map((product) => renderTemplate`${renderComponent($$result2, "ProductCard", $$ProductCard, { "product": product })}`)} </div>`} </div> ${renderScript($$result2, "/vercel/sandbox/primary/src/pages/products/index.astro?astro&type=script&index=0&lang.ts")} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/products/index.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/products/index.astro";
const $$url = "/products";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
