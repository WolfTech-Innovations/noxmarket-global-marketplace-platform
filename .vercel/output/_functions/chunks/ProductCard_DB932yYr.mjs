import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate } from './astro/server_D4-WhsIa.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro();
const $$ProductCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProductCard;
  const { product } = Astro2.props;
  if (!product) {
    return null;
  }
  const image = product.metadata.product_images?.[0];
  const imageUrl = image ? `${image.imgix_url}?w=600&h=600&fit=crop&auto=format,compress` : "";
  const price = product.metadata.price ? `$${product.metadata.price.toFixed(2)}` : "N/A";
  const inStock = product.metadata.in_stock;
  return renderTemplate`${maybeRenderHead()}<div class="card animate-fade-in hover:scale-[1.02] transition-transform duration-300"> <a${addAttribute(`/products/${product.slug}`, "href")} class="block"> ${imageUrl && renderTemplate`<div class="relative aspect-square overflow-hidden bg-gray-100"> <img${addAttribute(imageUrl, "src")}${addAttribute(product.metadata.product_name, "alt")} class="w-full h-full object-cover" width="300" height="300"> ${!inStock && renderTemplate`<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"> <span class="text-white font-bold text-lg">Out of Stock</span> </div>`} </div>`} <div class="p-4"> <h3 class="font-bold text-lg mb-2 line-clamp-2">${product.metadata.product_name}</h3> <div class="flex items-center justify-between"> <span class="text-2xl font-bold text-accent">${price}</span> ${inStock && renderTemplate`<span class="text-xs text-green-600 font-medium">In Stock</span>`} </div> ${product.metadata.seller && renderTemplate`<p class="text-sm text-gray-600 mt-2">
by ${product.metadata.seller.metadata?.business_name || product.metadata.seller.title} </p>`} </div> </a> </div>`;
}, "/vercel/sandbox/primary/src/components/ProductCard.astro", void 0);

export { $$ProductCard as $ };
