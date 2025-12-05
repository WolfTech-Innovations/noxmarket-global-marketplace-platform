import { f as getProducts, h as getCategories } from '../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../renderers.mjs';

const GET = async () => {
  const baseUrl = "https://noxmarket.com";
  const products = await getProducts();
  const categories = await getCategories();
  const staticPages = [
    "",
    "/products",
    "/search",
    "/login",
    "/signup"
  ];
  const productUrls = products.map((product) => ({
    url: `/products/${product.slug}`,
    lastmod: product.modified_at
  }));
  const categoryUrls = categories.map((category) => ({
    url: `/products?category=${category.slug}`,
    lastmod: category.modified_at
  }));
  const allUrls = [
    ...staticPages.map((path) => ({
      url: path,
      lastmod: (/* @__PURE__ */ new Date()).toISOString()
    })),
    ...productUrls,
    ...categoryUrls
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ url, lastmod }) => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
