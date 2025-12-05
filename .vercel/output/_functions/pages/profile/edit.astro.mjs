/* empty css                                    */
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_D4-WhsIa.mjs';
import 'piccolore';
import { $ as $$Layout, a as $$Header, b as $$Footer } from '../../chunks/Footer_Ck1w-9zV.mjs';
import { g as getSessionFromCookies } from '../../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Edit = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Edit;
  const session = getSessionFromCookies(Astro2.cookies);
  if (!session) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Edit Profile - NoxMarket" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main class="py-12"> <div class="container-custom"> <div class="max-w-2xl mx-auto"> <div class="card p-8"> <h1 class="text-3xl font-bold mb-8">Edit Profile</h1> <form action="/api/profile/update" method="POST" class="space-y-4"> <div> <label class="block font-medium mb-2">Name</label> <input type="text" name="name" required class="input"${addAttribute(session.name, "value")}> </div> <div> <label class="block font-medium mb-2">Email</label> <input type="email" name="email" required class="input"${addAttribute(session.email, "value")} readonly> <p class="text-sm text-gray-600 mt-1">Email cannot be changed</p> </div> <div class="flex gap-4"> <button type="submit" class="btn btn-primary">
Save Changes
</button> <a href="/profile" class="btn btn-secondary">
Cancel
</a> </div> </form> </div> </div> </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/vercel/sandbox/primary/src/pages/profile/edit.astro", void 0);

const $$file = "/vercel/sandbox/primary/src/pages/profile/edit.astro";
const $$url = "/profile/edit";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Edit,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
