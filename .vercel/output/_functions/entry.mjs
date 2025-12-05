import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DLxF9ojR.mjs';
import { manifest } from './manifest_BUcVj9Ea.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/auth/login.astro.mjs');
const _page4 = () => import('./pages/api/auth/logout.astro.mjs');
const _page5 = () => import('./pages/api/auth/signup.astro.mjs');
const _page6 = () => import('./pages/api/checkout.astro.mjs');
const _page7 = () => import('./pages/api/seller/update-settings.astro.mjs');
const _page8 = () => import('./pages/api/webhook/stripe.astro.mjs');
const _page9 = () => import('./pages/checkout.astro.mjs');
const _page10 = () => import('./pages/contact.astro.mjs');
const _page11 = () => import('./pages/dashboard/settings.astro.mjs');
const _page12 = () => import('./pages/dashboard.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/order-success.astro.mjs');
const _page15 = () => import('./pages/privacy.astro.mjs');
const _page16 = () => import('./pages/products/upoap.astro.mjs');
const _page17 = () => import('./pages/products/_slug_.astro.mjs');
const _page18 = () => import('./pages/products.astro.mjs');
const _page19 = () => import('./pages/profile/change-password.astro.mjs');
const _page20 = () => import('./pages/profile/edit.astro.mjs');
const _page21 = () => import('./pages/profile.astro.mjs');
const _page22 = () => import('./pages/robots.txt.astro.mjs');
const _page23 = () => import('./pages/search.astro.mjs');
const _page24 = () => import('./pages/signup.astro.mjs');
const _page25 = () => import('./pages/sitemap.xml.astro.mjs');
const _page26 = () => import('./pages/terms.astro.mjs');
const _page27 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/auth/login.ts", _page3],
    ["src/pages/api/auth/logout.ts", _page4],
    ["src/pages/api/auth/signup.ts", _page5],
    ["src/pages/api/checkout.ts", _page6],
    ["src/pages/api/seller/update-settings.ts", _page7],
    ["src/pages/api/webhook/stripe.ts", _page8],
    ["src/pages/checkout.astro", _page9],
    ["src/pages/contact.astro", _page10],
    ["src/pages/dashboard/settings.astro", _page11],
    ["src/pages/dashboard/index.astro", _page12],
    ["src/pages/login.astro", _page13],
    ["src/pages/order-success.astro", _page14],
    ["src/pages/privacy.astro", _page15],
    ["src/pages/products/upoap.js", _page16],
    ["src/pages/products/[slug].astro", _page17],
    ["src/pages/products/index.astro", _page18],
    ["src/pages/profile/change-password.astro", _page19],
    ["src/pages/profile/edit.astro", _page20],
    ["src/pages/profile.astro", _page21],
    ["src/pages/robots.txt.ts", _page22],
    ["src/pages/search.astro", _page23],
    ["src/pages/signup.astro", _page24],
    ["src/pages/sitemap.xml.ts", _page25],
    ["src/pages/terms.astro", _page26],
    ["src/pages/index.astro", _page27]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "43a4e860-f445-405b-a32a-174dca1bf266",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
