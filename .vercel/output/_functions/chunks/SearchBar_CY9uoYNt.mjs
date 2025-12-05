import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate } from './astro/server_D4-WhsIa.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro();
const $$SearchBar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SearchBar;
  const { initialQuery = "" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="relative"> <form action="/search" method="GET" class="w-full"> <div class="relative"> <input type="text" name="q" placeholder="Search products..."${addAttribute(initialQuery, "value")} class="input pr-12"> <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-accent transition-colors"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </button> </div> </form> </div>`;
}, "/vercel/sandbox/primary/src/components/SearchBar.astro", void 0);

export { $$SearchBar as $ };
