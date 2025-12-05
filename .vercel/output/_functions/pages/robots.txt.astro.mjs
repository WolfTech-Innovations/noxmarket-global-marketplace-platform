export { renderers } from '../renderers.mjs';

const GET = async () => {
  const baseUrl = "https://noxmarket.com";
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
