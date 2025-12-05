import { e as createComponent, f as createAstro, k as renderComponent, n as renderScript, r as renderTemplate, o as defineScriptVars, p as renderSlot, q as renderHead, h as addAttribute, m as maybeRenderHead, l as Fragment } from './astro/server_D4-WhsIa.mjs';
import 'piccolore';
/* empty css                         */
import { g as getSessionFromCookies } from './auth_Du1TDwjH.mjs';
import 'clsx';

const $$Astro$2 = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Index;
  const propsStr = JSON.stringify(Astro2.props);
  const paramsStr = JSON.stringify(Astro2.params);
  return renderTemplate`${renderComponent($$result, "vercel-analytics", "vercel-analytics", { "data-props": propsStr, "data-params": paramsStr, "data-pathname": Astro2.url.pathname })} ${renderScript($$result, "/vercel/sandbox/primary/node_modules/@vercel/analytics/dist/astro/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/vercel/sandbox/primary/node_modules/@vercel/analytics/dist/astro/index.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description = "NoxMarket - Global marketplace powered by WolfTech Innovations" } = Astro2.props;
  const bucketSlug = undefined                                  ;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="description"', '><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><meta name="generator"', "><title>", '</title><!-- Console capture script for dashboard debugging --><script src="/dashboard-console-capture.js"></script>', "", "</head> <body> ", " <script>(function(){", `
      // Create the cosmic badge element
      function createCosmicBadge() {
        const isDismissed = localStorage.getItem('cosmic-badge-dismissed');
        if (isDismissed) return;
        
        const badge = document.createElement('a');
        badge.id = 'cosmic-badge';
        badge.href = \`https://www.cosmicjs.com?utm_source=bucket_\${bucketSlug}&utm_medium=referral&utm_campaign=app_badge&utm_content=built_with_cosmic\`;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.innerHTML = \`
          <button id="cosmic-dismiss" style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 24px;
            height: 24px;
            background: #f3f4f6;
            border: none;
            border-radius: 50%;
            color: #374151;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            z-index: 10;
          ">×</button>
          <img src="https://cdn.cosmicjs.com/b67de7d0-c810-11ed-b01d-23d7b265c299-logo508x500.svg" 
               alt="Cosmic Logo" 
               style="width: 20px; height: 20px;">
          Built with Cosmic
        \`;
        
        Object.assign(badge.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#11171A',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          width: '180px',
          borderRadius: '8px',
          zIndex: '50',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.2s ease',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        });
        
        document.body.appendChild(badge);
        
        const dismissBtn = document.getElementById('cosmic-dismiss');
        if (dismissBtn) {
          dismissBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            badge.remove();
            localStorage.setItem('cosmic-badge-dismissed', 'true');
          };
          
          dismissBtn.onmouseenter = () => dismissBtn.style.backgroundColor = '#e5e7eb';
          dismissBtn.onmouseleave = () => dismissBtn.style.backgroundColor = '#f3f4f6';
        }
        
        badge.onmouseenter = () => badge.style.backgroundColor = '#f9fafb';
        badge.onmouseleave = () => badge.style.backgroundColor = 'white';
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(createCosmicBadge, 1000);
        });
      } else {
        setTimeout(createCosmicBadge, 1000);
      }
    })();</script> </body> </html>`], ['<html lang="en"> <head><meta charset="UTF-8"><meta name="description"', '><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><meta name="generator"', "><title>", '</title><!-- Console capture script for dashboard debugging --><script src="/dashboard-console-capture.js"></script>', "", "</head> <body> ", " <script>(function(){", `
      // Create the cosmic badge element
      function createCosmicBadge() {
        const isDismissed = localStorage.getItem('cosmic-badge-dismissed');
        if (isDismissed) return;
        
        const badge = document.createElement('a');
        badge.id = 'cosmic-badge';
        badge.href = \\\`https://www.cosmicjs.com?utm_source=bucket_\\\${bucketSlug}&utm_medium=referral&utm_campaign=app_badge&utm_content=built_with_cosmic\\\`;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.innerHTML = \\\`
          <button id="cosmic-dismiss" style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 24px;
            height: 24px;
            background: #f3f4f6;
            border: none;
            border-radius: 50%;
            color: #374151;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            z-index: 10;
          ">×</button>
          <img src="https://cdn.cosmicjs.com/b67de7d0-c810-11ed-b01d-23d7b265c299-logo508x500.svg" 
               alt="Cosmic Logo" 
               style="width: 20px; height: 20px;">
          Built with Cosmic
        \\\`;
        
        Object.assign(badge.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#11171A',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          width: '180px',
          borderRadius: '8px',
          zIndex: '50',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.2s ease',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        });
        
        document.body.appendChild(badge);
        
        const dismissBtn = document.getElementById('cosmic-dismiss');
        if (dismissBtn) {
          dismissBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            badge.remove();
            localStorage.setItem('cosmic-badge-dismissed', 'true');
          };
          
          dismissBtn.onmouseenter = () => dismissBtn.style.backgroundColor = '#e5e7eb';
          dismissBtn.onmouseleave = () => dismissBtn.style.backgroundColor = '#f3f4f6';
        }
        
        badge.onmouseenter = () => badge.style.backgroundColor = '#f9fafb';
        badge.onmouseleave = () => badge.style.backgroundColor = 'white';
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(createCosmicBadge, 1000);
        });
      } else {
        setTimeout(createCosmicBadge, 1000);
      }
    })();</script> </body> </html>`])), addAttribute(description, "content"), addAttribute(Astro2.generator, "content"), title, renderComponent($$result, "Analytics", $$Index, {}), renderHead(), renderSlot($$result, $$slots["default"]), defineScriptVars({ bucketSlug }));
}, "/vercel/sandbox/primary/src/layouts/Layout.astro", void 0);

const $$Astro = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Header;
  const session = getSessionFromCookies(Astro2.cookies);
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm"> <nav class="container-custom py-4"> <div class="flex items-center justify-between"> <a href="/" class="flex items-center gap-2 text-2xl font-bold text-primary hover:text-accent transition-colors"> <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> </svg> <span>NoxMarket</span> </a> <div class="hidden md:flex items-center gap-8"> <a href="/"${addAttribute(`text-sm font-medium transition-colors ${currentPath === "/" ? "text-primary" : "text-gray-600 hover:text-primary"}`, "class")}>
Home
</a> <a href="/products"${addAttribute(`text-sm font-medium transition-colors ${currentPath.startsWith("/products") ? "text-primary" : "text-gray-600 hover:text-primary"}`, "class")}>
Products
</a> <a href="/search"${addAttribute(`text-sm font-medium transition-colors ${currentPath === "/search" ? "text-primary" : "text-gray-600 hover:text-primary"}`, "class")}>
Search
</a> ${session ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`${session.userType === "seller" && renderTemplate`<a href="/dashboard"${addAttribute(`text-sm font-medium transition-colors ${currentPath.startsWith("/dashboard") ? "text-primary" : "text-gray-600 hover:text-primary"}`, "class")}>
Dashboard
</a>`}<a href="/profile"${addAttribute(`text-sm font-medium transition-colors ${currentPath === "/profile" ? "text-primary" : "text-gray-600 hover:text-primary"}`, "class")}>
Profile
</a> <form action="/api/auth/logout" method="POST" class="inline"> <button type="submit" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Logout
</button> </form> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <a href="/login" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Login
</a> <a href="/signup" class="btn btn-primary text-sm">
Sign Up
</a> ` })}`} </div> <button id="mobile-menu-button" class="md:hidden text-primary"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> </button> </div> <div id="mobile-menu" class="hidden md:hidden mt-4 pb-4 border-t border-gray-200 pt-4"> <div class="flex flex-col gap-4"> <a href="/" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Home
</a> <a href="/products" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Products
</a> <a href="/search" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Search
</a> ${session ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`${session.userType === "seller" && renderTemplate`<a href="/dashboard" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Dashboard
</a>`}<a href="/profile" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Profile
</a> <form action="/api/auth/logout" method="POST"> <button type="submit" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors text-left">
Logout
</button> </form> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <a href="/login" class="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
Login
</a> <a href="/signup" class="btn btn-primary text-sm inline-block text-center">
Sign Up
</a> ` })}`} </div> </div> </nav> </header> ${renderScript($$result, "/vercel/sandbox/primary/src/components/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "/vercel/sandbox/primary/src/components/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="bg-primary text-secondary mt-20"> <div class="container-custom py-12"> <div class="grid grid-cols-1 md:grid-cols-4 gap-8"> <div> <div class="flex items-center gap-2 text-2xl font-bold mb-4"> <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> </svg> <span>NoxMarket</span> </div> <p class="text-gray-300 text-sm">
Global marketplace powered by WolfTech Innovations
</p> </div> <div> <h3 class="font-bold mb-4">Shop</h3> <ul class="space-y-2 text-sm"> <li><a href="/products" class="text-gray-300 hover:text-accent transition-colors">All Products</a></li> <li><a href="/search" class="text-gray-300 hover:text-accent transition-colors">Search</a></li> <li><a href="/categories" class="text-gray-300 hover:text-accent transition-colors">Categories</a></li> </ul> </div> <div> <h3 class="font-bold mb-4">Sell</h3> <ul class="space-y-2 text-sm"> <li><a href="/signup?type=seller" class="text-gray-300 hover:text-accent transition-colors">Become a Seller</a></li> <li><a href="/dashboard" class="text-gray-300 hover:text-accent transition-colors">Seller Dashboard</a></li> </ul> </div> <div> <h3 class="font-bold mb-4">Company</h3> <ul class="space-y-2 text-sm"> <li><a href="/about" class="text-gray-300 hover:text-accent transition-colors">About Us</a></li> <li><a href="/contact" class="text-gray-300 hover:text-accent transition-colors">Contact</a></li> <li><a href="/terms" class="text-gray-300 hover:text-accent transition-colors">Terms of Service</a></li> <li><a href="/privacy" class="text-gray-300 hover:text-accent transition-colors">Privacy Policy</a></li> </ul> </div> </div> <div class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300"> <p>&copy; ${currentYear} NoxMarket by WolfTech Innovations. All rights reserved.</p> </div> </div> </footer>`;
}, "/vercel/sandbox/primary/src/components/Footer.astro", void 0);

export { $$Layout as $, $$Header as a, $$Footer as b };
