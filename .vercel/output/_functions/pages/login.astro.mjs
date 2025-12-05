/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Login = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const session = getSessionFromCookies(Astro2.cookies);
  if (session) {
    return Astro2.redirect("/profile");
  }
  const error = Astro2.url.searchParams.get("error");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Login - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-md mx-auto"> <div class="card p-8"> <h1 class="text-3xl font-bold mb-6 text-center">Login</h1> ${error && renderTemplate`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"> <p class="text-red-800 text-sm">${error}</p> </div>`} <form action="/api/auth/login" method="POST" class="space-y-4"> <div> <label class="block font-medium mb-2">Email</label> <input type="email" name="email" required class="input" placeholder="your@email.com"> </div> <div> <label class="block font-medium mb-2">Password</label> <input type="password" name="password" required class="input" placeholder="••••••••"> </div> <button type="submit" class="btn btn-primary w-full">
Login
</button> </form> <div class="mt-6 text-center"> <p class="text-gray-600">
Don't have an account?
<a href="/signup" class="text-accent font-medium hover:underline">Sign up</a> </p> </div> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/login.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
