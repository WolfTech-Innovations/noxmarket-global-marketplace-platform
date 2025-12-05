/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, l as Fragment, h as addAttribute, u as unescapeHTML, m as maybeRenderHead } from '../../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../../chunks/Footer_Ck1w-9zV.mjs';
import { b as getProduct } from '../../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../../renderers.mjs';

function generateProductJsonLd(product, baseUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.metadata.product_name,
    description: product.metadata.description,
    image: product.metadata.product_images?.[0]?.imgix_url || "",
    offers: {
      "@type": "Offer",
      price: product.metadata.price,
      priceCurrency: "USD",
      availability: product.metadata.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${baseUrl}/products/${product.slug}`
    }
  };
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  if (!slug) {
    return Astro2.redirect("/products");
  }
  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    console.error("Error fetching product:", error);
    return Astro2.redirect("/404");
  }
  if (!product) {
    return Astro2.redirect("/404");
  }
  const productImages = product.metadata.product_images ?? [];
  const primaryImage = productImages[0];
  const imageUrl = primaryImage ? `${primaryImage.imgix_url}?w=1200&h=1200&fit=crop&auto=format,compress` : "";
  const price = product.metadata.price ?? 0;
  const formattedPrice = price > 0 ? `$${price.toFixed(2)}` : "Price not available";
  const inStock = product.metadata.in_stock ?? false;
  const stockQuantity = product.metadata.stock_quantity ?? 0;
  const seller = product.metadata.seller;
  const sellerName = seller?.metadata?.business_name || seller?.title || "Unknown Seller";
  const category = product.metadata.category;
  const categoryName = category?.metadata?.category_name || "Uncategorized";
  const categoryIcon = category?.metadata?.category_icon;
  const baseUrl = "https://noxmarket.com";
  const jsonLd = generateProductJsonLd(product, baseUrl);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${product.metadata.product_name} - NoxMarket`, "description": product.metadata.description?.substring(0, 160) || `Buy ${product.metadata.product_name} on NoxMarket` }, { "default": async ($$result2) => renderTemplate`  ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-8 md:py-12"> <div class="container-custom"> <!-- Breadcrumb navigation --> <nav class="mb-6 text-sm" aria-label="Breadcrumb"> <ol class="flex items-center gap-2 text-gray-600"> <li><a href="/" class="hover:text-primary transition-colors">Home</a></li> <li><span class="text-gray-400">/</span></li> <li><a href="/products" class="hover:text-primary transition-colors">Products</a></li> ${category && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <li><span class="text-gray-400">/</span></li> <li> <a${addAttribute(`/products?category=${category.slug}`, "href")} class="hover:text-primary transition-colors"> ${categoryName} </a> </li> ` })}`} <li><span class="text-gray-400">/</span></li> <li class="text-gray-900 font-medium truncate" aria-current="page"> ${product.metadata.product_name} </li> </ol> </nav> <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"> <!-- Product Image Section --> <div class="animate-fade-in"> ${imageUrl ? renderTemplate`<div class="sticky top-4"> <div class="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg"> <img${addAttribute(imageUrl, "src")}${addAttribute(product.metadata.product_name, "alt")} class="w-full h-full object-cover" width="600" height="600" loading="eager"> </div> <!-- Additional images preview (if multiple images exist) --> ${productImages.length > 1 && renderTemplate`<div class="mt-4 grid grid-cols-4 gap-2"> ${productImages.slice(1, 5).map((img) => renderTemplate`<div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-primary transition-all cursor-pointer"> <img${addAttribute(`${img.imgix_url}?w=200&h=200&fit=crop&auto=format,compress`, "src")}${addAttribute(`${product.metadata.product_name} additional view`, "alt")} class="w-full h-full object-cover" width="100" height="100" loading="lazy"> </div>`)} </div>`} </div>` : renderTemplate`<div class="aspect-square rounded-2xl bg-gray-200 flex items-center justify-center"> <svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path> </svg> </div>`} </div> <!-- Product Details Section --> <div class="animate-slide-up"> <!-- Product Title --> <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"> ${product.metadata.product_name} </h1> <!-- Price and Stock Status --> <div class="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200"> <div> <p class="text-sm text-gray-600 mb-1">Price</p> <span class="text-3xl md:text-4xl font-bold text-accent"> ${formattedPrice} </span> </div> <div class="flex items-center gap-2"> ${inStock ? renderTemplate`<span class="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"> <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path> </svg>
In Stock (${stockQuantity} available)
</span>` : renderTemplate`<span class="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200"> <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path> </svg>
Out of Stock
</span>`} </div> </div> <!-- Seller Information --> ${seller && renderTemplate`<div class="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"> <p class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Sold by</p> <div class="flex items-center gap-3"> <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg"> ${sellerName.charAt(0).toUpperCase()} </div> <div> <p class="font-bold text-lg text-gray-900">${sellerName}</p> <a href="#" class="text-xs text-primary hover:underline">View seller profile</a> </div> </div> </div>`} <!-- Product Description --> <div class="mb-8"> <h2 class="text-xl font-bold mb-3">Product Description</h2> <div class="prose prose-gray max-w-none text-gray-700 leading-relaxed">${unescapeHTML(product.metadata.description || "No description available.")}</div> </div> <!-- Purchase Form --> ${inStock ? renderTemplate`<form action="/api/checkout" method="POST" class="space-y-5 p-6 bg-gray-50 rounded-xl border border-gray-200"> <input type="hidden" name="productId"${addAttribute(product.slug, "value")}> <div> <label for="quantity" class="block text-sm font-semibold mb-2 text-gray-900">
Quantity
</label> <input id="quantity" type="number" name="quantity" min="1" value="1"${addAttribute(stockQuantity, "max")} class="input w-32 text-center font-semibold" required> <p class="text-xs text-gray-500 mt-1">Maximum: ${stockQuantity} units</p> </div> <button type="submit" class="btn btn-primary w-full text-lg py-4 font-semibold shadow-lg hover:shadow-xl transition-all"> <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path> </svg>
Buy Now
</button> </form>` : renderTemplate`<div class="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center"> <svg class="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <p class="text-gray-600 font-medium mb-2">Currently Unavailable</p> <p class="text-sm text-gray-500">This product is out of stock. Check back later!</p> </div>`} <!-- Category Badge --> ${category && renderTemplate`<div class="mt-8 pt-6 border-t border-gray-200"> <p class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Category</p> <a${addAttribute(`/products?category=${category.slug}`, "href")} class="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-xl hover:bg-gray-50 transition-all border border-gray-200 shadow-sm hover:shadow-md group"> ${categoryIcon && renderTemplate`<img${addAttribute(`${categoryIcon.imgix_url}?w=40&h=40&fit=crop&auto=format,compress`, "src")} alt="" class="w-6 h-6 rounded-full" width="24" height="24">`} <span class="font-semibold text-gray-900 group-hover:text-primary transition-colors"> ${categoryName} </span> <svg class="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </a> </div>`} </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} `, "head": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "head" }, { "default": async ($$result3) => renderTemplate(_a || (_a = __template([' <script type="application/ld+json">', '</script>  <meta property="og:title"', '> <meta property="og:description"', '> <meta property="og:image"', '> <meta property="og:type" content="product"> <meta property="product:price:amount"', '> <meta property="product:price:currency" content="USD"> '])), unescapeHTML(JSON.stringify(jsonLd)), addAttribute(`${product.metadata.product_name} - NoxMarket`, "content"), addAttribute(product.metadata.description?.substring(0, 160), "content"), addAttribute(imageUrl, "content"), addAttribute(price.toString(), "content")) })}` })}`;
}, "/vercel/sandbox/primary/src/pages/products/[slug].astro", void 0);
const $$file = "/vercel/sandbox/primary/src/pages/products/[slug].astro";
const $$url = "/products/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
