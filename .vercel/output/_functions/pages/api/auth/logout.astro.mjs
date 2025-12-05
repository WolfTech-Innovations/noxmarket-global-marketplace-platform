import { d as deleteSession, b as clearSessionCookie } from '../../../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ cookies, redirect }) => {
  try {
    const token = cookies.get("noxmarket_session")?.value;
    if (token) {
      deleteSession(token);
    }
    clearSessionCookie(cookies);
    return redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    return redirect("/");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
