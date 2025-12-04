import type { APIRoute } from 'astro';
import { getProducts, getCategories } from '@/lib/cosmic';

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE || 'https://noxmarket.com';
  
  const products = await getProducts();
  const categories = await getCategories();
  
  const staticPages = [
    '',
    '/products',
    '/search',
    '/login',
    '/signup'
  ];
  
  const productUrls = products.map(product => ({
    url: `/products/${product.slug}`,
    lastmod: product.modified_at
  }));
  
  const categoryUrls = categories.map(category => ({
    url: `/products?category=${category.slug}`,
    lastmod: category.modified_at
  }));
  
  const allUrls = [
    ...staticPages.map(path => ({
      url: path,
      lastmod: new Date().toISOString()
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
    <priority>${url === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};