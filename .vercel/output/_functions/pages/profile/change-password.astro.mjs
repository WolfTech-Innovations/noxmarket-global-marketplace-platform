/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$ChangePassword = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ChangePassword;
  const session = getSessionFromCookies(Astro2.cookies);
  if (!session) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Change Password - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-2xl mx-auto"> <div class="card p-8"> <h1 class="text-3xl font-bold mb-8">Change Password</h1> <form action="/api/profile/change-password" method="POST" class="space-y-4"> <div> <label class="block font-medium mb-2">Current Password</label> <input type="password" name="currentPassword" required class="input"> </div> <div> <label class="block font-medium mb-2">New Password</label> <input type="password" name="newPassword" required minlength="8" class="input"> </div> <div> <label class="block font-medium mb-2">Confirm New Password</label> <input type="password" name="confirmPassword" required minlength="8" class="input"> </div> <div class="flex gap-4"> <button type="submit" class="btn btn-primary">
Update Password
</button> <a href="/profile" class="btn btn-secondary">
Cancel
</a> </div> </form> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/profile/change-password.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/profile/change-password.astro";
const $$url = "/profile/change-password";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ChangePassword,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
