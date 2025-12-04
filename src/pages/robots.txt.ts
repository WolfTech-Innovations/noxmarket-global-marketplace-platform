import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const baseUrl = import.meta.env.SITE || 'https://noxmarket.com';
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};