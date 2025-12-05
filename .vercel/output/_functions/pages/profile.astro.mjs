/* empty css                                 */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Profile = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Profile;
  const session = getSessionFromCookies(Astro2.cookies);
  if (!session) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Profile - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-2xl mx-auto"> <div class="card p-8"> <h1 class="text-3xl font-bold mb-8">Your Profile</h1> <div class="space-y-6"> <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"> <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold"> ${session.name.charAt(0).toUpperCase()} </div> <div> <h2 class="text-xl font-bold">${session.name}</h2> <p class="text-gray-600">${session.email}</p> <span class="inline-block mt-1 px-3 py-1 bg-accent text-white rounded-full text-xs font-medium"> ${session.userType === "seller" ? "Seller Account" : "Buyer Account"} </span> </div> </div> ${session.userType === "seller" && renderTemplate`<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg"> <h3 class="font-bold mb-2">Seller Dashboard</h3> <p class="text-sm text-gray-600 mb-4">
Manage your products and view your orders
</p> <a href="/dashboard" class="btn btn-primary">
Go to Dashboard
</a> </div>`} <div> <h3 class="font-bold text-lg mb-4">Account Settings</h3> <div class="space-y-2"> <a href="/profile/edit" class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"> <div class="flex items-center justify-between"> <span class="font-medium">Edit Profile</span> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </div> </a> <a href="/profile/change-password" class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"> <div class="flex items-center justify-between"> <span class="font-medium">Change Password</span> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </div> </a> </div> </div> <form action="/api/auth/logout" method="POST"> <button type="submit" class="btn btn-secondary w-full">
Logout
</button> </form> </div> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/profile.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/profile.astro";
const $$url = "/profile";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Profile,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
