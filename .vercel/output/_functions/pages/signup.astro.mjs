/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Signup = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Signup;
  const session = getSessionFromCookies(Astro2.cookies);
  if (session) {
    return Astro2.redirect("/profile");
  }
  const userType = Astro2.url.searchParams.get("type") || "buyer";
  const error = Astro2.url.searchParams.get("error");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign Up - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-md mx-auto"> <div class="card p-8"> <h1 class="text-3xl font-bold mb-6 text-center">Sign Up</h1> ${error && renderTemplate`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"> <p class="text-red-800 text-sm">${error}</p> </div>`} <div class="flex gap-2 mb-6"> <a href="/signup?type=buyer"${addAttribute(`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${userType === "buyer" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`, "class")}>
Buyer
</a> <a href="/signup?type=seller"${addAttribute(`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${userType === "seller" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`, "class")}>
Seller
</a> </div> <form action="/api/auth/signup" method="POST" class="space-y-4"> <input type="hidden" name="userType"${addAttribute(userType, "value")}> <div> <label class="block font-medium mb-2">Name</label> <input type="text" name="name" required class="input" placeholder="Your name"> </div> <div> <label class="block font-medium mb-2">Email</label> <input type="email" name="email" required class="input" placeholder="your@email.com"> </div> <div> <label class="block font-medium mb-2">Password</label> <input type="password" name="password" required minlength="8" class="input" placeholder="••••••••"> </div> ${userType === "seller" && renderTemplate`<div> <label class="block font-medium mb-2">Business Name</label> <input type="text" name="businessName" required class="input" placeholder="Your business name"> </div>`} <button type="submit" class="btn btn-primary w-full">
Create Account
</button> </form> <div class="mt-6 text-center"> <p class="text-gray-600">
Already have an account?
<a href="/login" class="text-accent font-medium hover:underline">Login</a> </p> </div> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/signup.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/signup.astro";
const $$url = "/signup";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Signup,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
