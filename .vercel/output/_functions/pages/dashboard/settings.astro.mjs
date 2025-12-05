/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../../chunks/auth_Du1TDwjH.mjs';
import { d as getSeller } from '../../chunks/cosmic_-UWy_jvB.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Settings = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Settings;
  const session = getSessionFromCookies(Astro2.cookies);
  if (!session || session.userType !== "seller" || !session.sellerId) {
    return Astro2.redirect("/login");
  }
  const sellerProfile = await getSeller(session.sellerId);
  const errorMessage = Astro2.url.searchParams.get("error");
  const successMessage = Astro2.url.searchParams.get("success");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Store Settings - NoxMarket" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-8 md:py-12 bg-gray-50 min-h-screen"> <div class="container-custom max-w-4xl"> <!-- Header --> <div class="mb-8"> <a href="/dashboard" class="text-accent hover:underline mb-4 inline-flex items-center gap-2"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path> </svg>
Back to Dashboard
</a> <h1 class="text-3xl md:text-4xl font-bold mb-2 mt-4">Store Settings</h1> <p class="text-gray-600">Manage your store information and payment settings</p> </div> <!-- Success/Error Messages --> ${successMessage && renderTemplate`<div class="mb-6 bg-green-50 border-l-4 border-green-500 rounded-xl p-4 animate-fade-in"> <div class="flex items-center gap-3"> <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path> </svg> <p class="text-green-800 font-medium">${successMessage}</p> </div> </div>`} ${errorMessage && renderTemplate`<div class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-xl p-4 animate-fade-in"> <div class="flex items-center gap-3"> <svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> <p class="text-red-800 font-medium">${errorMessage}</p> </div> </div>`} <!-- Settings Form --> <form action="/api/seller/update-settings" method="POST" class="space-y-6"> <!-- Business Information --> <div class="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100"> <div class="flex items-center gap-3 mb-6"> <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"> <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path> </svg> </div> <div> <h2 class="text-xl font-bold text-gray-900">Business Information</h2> <p class="text-sm text-gray-500">Your store's public information</p> </div> </div> <div class="space-y-4"> <div> <label for="business_name" class="block text-sm font-semibold text-gray-700 mb-2">
Business Name
</label> <input type="text" id="business_name" name="business_name"${addAttribute(sellerProfile?.metadata?.business_name || "", "value")} class="input w-full" required> </div> <div> <label for="store_description" class="block text-sm font-semibold text-gray-700 mb-2">
Store Description
</label> <textarea id="store_description" name="store_description" rows="4" class="input w-full resize-none" placeholder="Tell customers about your store...">${sellerProfile?.metadata?.store_description || ""}</textarea> <p class="text-xs text-gray-500 mt-1">This will be displayed on your store page</p> </div> <div> <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
Contact Phone
</label> <input type="tel" id="phone" name="phone"${addAttribute(sellerProfile?.metadata?.phone || "", "value")} class="input w-full" placeholder="+1 (555) 000-0000"> </div> </div> </div> <!-- Payment Settings --> <div class="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100"> <div class="flex items-center gap-3 mb-6"> <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"> <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path> </svg> </div> <div> <h2 class="text-xl font-bold text-gray-900">Payment Settings</h2> <p class="text-sm text-gray-500">Configure how you receive payments</p> </div> </div> <div class="space-y-4"> <div> <label for="stripe_account_id" class="block text-sm font-semibold text-gray-700 mb-2">
Stripe Account ID
<span class="text-red-500">*</span> </label> <input type="text" id="stripe_account_id" name="stripe_account_id"${addAttribute(sellerProfile?.metadata?.stripe_account_id || "", "value")} class="input w-full font-mono text-sm" placeholder="acct_..." required> <div class="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100"> <div class="flex gap-3"> <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <div class="text-sm text-blue-900"> <p class="font-semibold mb-1">How to get your Stripe Account ID:</p> <ol class="list-decimal list-inside space-y-1 text-blue-800"> <li>Log in to your <a href="https://dashboard.stripe.com" target="_blank" rel="noopener" class="underline hover:text-blue-600">Stripe Dashboard</a></li> <li>Click on your profile icon in the top right</li> <li>Your Account ID starts with "acct_" and is displayed there</li> <li>Copy and paste it here</li> </ol> </div> </div> </div> </div> ${sellerProfile?.metadata?.stripe_account_id && renderTemplate`<div class="p-4 bg-green-50 rounded-lg border border-green-200"> <div class="flex items-start gap-3"> <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <div class="text-sm"> <p class="font-semibold text-green-900 mb-1">Stripe Connected</p> <p class="text-green-800">Your store is ready to receive payments!</p> </div> </div> </div>`} </div> </div> <!-- Save Button --> <div class="flex items-center justify-between bg-white rounded-2xl shadow-sm p-6 border border-gray-100"> <p class="text-sm text-gray-600"> <span class="text-red-500">*</span> Required fields must be filled
</p> <button type="submit" class="btn btn-primary px-8"> <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path> </svg>
Save Changes
</button> </div> </form> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/dashboard/settings.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/dashboard/settings.astro";
const $$url = "/dashboard/settings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Settings,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
