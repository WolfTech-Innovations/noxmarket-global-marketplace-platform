/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { $ as $$ProductCard } from '../chunks/ProductCard_DB932yYr.mjs';
import { $ as $$SearchBar } from '../chunks/SearchBar_CY9uoYNt.mjs';
import { f as getProducts, h as getCategories } from '../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../renderers.mjs';

function searchProducts(products, filters) {
  let filtered = [...products];
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      (product) => product.metadata.product_name.toLowerCase().includes(query) || product.metadata.description.toLowerCase().includes(query)
    );
  }
  if (filters.category) {
    filtered = filtered.filter(
      (product) => product.metadata.category?.slug === filters.category
    );
  }
  if (filters.minPrice !== void 0) {
    filtered = filtered.filter(
      (product) => product.metadata.price >= filters.minPrice
    );
  }
  if (filters.maxPrice !== void 0) {
    filtered = filtered.filter(
      (product) => product.metadata.price <= filters.maxPrice
    );
  }
  if (filters.inStock !== void 0) {
    filtered = filtered.filter(
      (product) => product.metadata.in_stock === filters.inStock
    );
  }
  return filtered;
}
function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.metadata.price - b.metadata.price);
    case "price-desc":
      return sorted.sort((a, b) => b.metadata.price - a.metadata.price);
    case "name":
      return sorted.sort(
        (a, b) => a.metadata.product_name.localeCompare(b.metadata.product_name)
      );
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return sorted;
  }
}

const $$Astro = createAstro();
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  const query = Astro2.url.searchParams.get("q") || "";
  const category = Astro2.url.searchParams.get("category") || "";
  const minPrice = Astro2.url.searchParams.get("minPrice");
  const maxPrice = Astro2.url.searchParams.get("maxPrice");
  const inStock = Astro2.url.searchParams.get("inStock") === "true";
  const sort = Astro2.url.searchParams.get("sort") || "newest";
  const allProducts = await getProducts();
  const categories = await getCategories();
  const filteredProducts = searchProducts(allProducts, {
    query,
    category,
    minPrice: minPrice ? parseFloat(minPrice) : void 0,
    maxPrice: maxPrice ? parseFloat(maxPrice) : void 0,
    inStock: inStock || void 0
  });
  const sortedProducts = sortProducts(
    filteredProducts,
    sort
  );
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Search Products - NoxMarket" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <h1 class="text-4xl font-bold mb-8">Search Products</h1> <div class="grid grid-cols-1 lg:grid-cols-4 gap-8"> <!-- Filters Sidebar --> <div class="lg:col-span-1"> <div class="card p-6 sticky top-24"> <h2 class="font-bold text-lg mb-4">Filters</h2> <form method="GET" action="/search" class="space-y-6"> ${query && renderTemplate`<input type="hidden" name="q"${addAttribute(query, "value")}>`} <!-- Category Filter --> ${categories.length > 0 && renderTemplate`<div> <label class="block font-medium mb-2 text-sm">Category</label> <select name="category" class="input"> <option value="">All Categories</option> ${categories.map((cat) => renderTemplate`<option${addAttribute(cat.slug, "value")}${addAttribute(category === cat.slug, "selected")}> ${cat.metadata.category_name} </option>`)} </select> </div>`} <!-- Price Range --> <div> <label class="block font-medium mb-2 text-sm">Price Range</label> <div class="grid grid-cols-2 gap-2"> <input type="number" name="minPrice" placeholder="Min"${addAttribute(minPrice || "", "value")} class="input"> <input type="number" name="maxPrice" placeholder="Max"${addAttribute(maxPrice || "", "value")} class="input"> </div> </div> <!-- In Stock Filter --> <div> <label class="flex items-center gap-2 cursor-pointer"> <input type="checkbox" name="inStock" value="true"${addAttribute(inStock, "checked")} class="w-4 h-4"> <span class="text-sm">In Stock Only</span> </label> </div> <button type="submit" class="btn btn-primary w-full">
Apply Filters
</button> <a href="/search" class="btn btn-secondary w-full">
Clear Filters
</a> </form> </div> </div> <!-- Results --> <div class="lg:col-span-3"> <div class="mb-6"> ${renderComponent($$result2, "SearchBar", $$SearchBar, { "initialQuery": query })} </div> <div class="flex items-center justify-between mb-6"> <p class="text-gray-600"> ${sortedProducts.length} ${sortedProducts.length === 1 ? "result" : "results"} found
</p> <form method="GET" action="/search" class="flex items-center gap-2"> ${query && renderTemplate`<input type="hidden" name="q"${addAttribute(query, "value")}>`} ${category && renderTemplate`<input type="hidden" name="category"${addAttribute(category, "value")}>`} ${minPrice && renderTemplate`<input type="hidden" name="minPrice"${addAttribute(minPrice, "value")}>`} ${maxPrice && renderTemplate`<input type="hidden" name="maxPrice"${addAttribute(maxPrice, "value")}>`} ${inStock && renderTemplate`<input type="hidden" name="inStock" value="true">`} <label class="text-sm font-medium">Sort by:</label> <select name="sort" class="input py-2" onchange="this.form.submit()"> <option value="newest"${addAttribute(sort === "newest", "selected")}>Newest</option> <option value="price-asc"${addAttribute(sort === "price-asc", "selected")}>Price: Low to High</option> <option value="price-desc"${addAttribute(sort === "price-desc", "selected")}>Price: High to Low</option> <option value="name"${addAttribute(sort === "name", "selected")}>Name: A to Z</option> </select> </form> </div> ${sortedProducts.length === 0 ? renderTemplate`<div class="text-center py-20"> <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> <h2 class="text-2xl font-bold mb-2">No Results Found</h2> <p class="text-gray-600 mb-6">Try adjusting your search or filters</p> <a href="/search" class="btn btn-primary">
Clear Search
</a> </div>` : renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> ${sortedProducts.map((product) => renderTemplate`${renderComponent($$result2, "ProductCard", $$ProductCard, { "product": product })}`)} </div>`} </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/search.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
