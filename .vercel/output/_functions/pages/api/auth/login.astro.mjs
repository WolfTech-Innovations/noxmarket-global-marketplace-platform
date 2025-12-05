import { g as getUserByEmail, c as cosmic } from '../../../chunks/cosmic_-UWy_jvB.mjs';
import { v as verifyPassword, c as createSessionToken, s as storeSession, a as setSessionCookie } from '../../../chunks/auth_Du1TDwjH.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    if (!email || !password) {
      return redirect("/login?error=Email and password are required");
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return redirect("/login?error=Invalid email or password");
    }
    if (!user.metadata.password_hash) {
      console.error("User missing password_hash:", user.id);
      return redirect("/login?error=Account not properly configured");
    }
    const isValid = await verifyPassword(password, user.metadata.password_hash);
    if (!isValid) {
      return redirect("/login?error=Invalid email or password");
    }
    const userType = user.metadata.user_type || "buyer";
    const sessionToken = createSessionToken();
    const session = {
      userId: user.id,
      email: user.metadata.email,
      userType,
      name: user.metadata.name || user.title || "User"
    };
    if (userType === "seller") {
      try {
        const sellerProfile = await cosmic.objects.findOne({
          type: "sellers",
          "metadata.user_id": user.id
        }).props("id,slug,title,metadata");
        if (sellerProfile.object) {
          session.sellerId = sellerProfile.object.id;
          session.businessName = sellerProfile.object.metadata.business_name;
        }
      } catch (error) {
        console.error("Could not fetch seller profile:", error);
      }
    }
    console.log("Login successful:", {
      email,
      userType,
      userId: user.id,
      name: session.name,
      sellerId: session.sellerId
    });
    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken, session);
    if (userType === "seller") {
      return redirect("/dashboard");
    }
    return redirect("/profile");
  } catch (error) {
    console.error("Login error:", error);
    return redirect("/login?error=Failed to login");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
