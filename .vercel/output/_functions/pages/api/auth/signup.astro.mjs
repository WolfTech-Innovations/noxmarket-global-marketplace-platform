import { g as getUserByEmail, a as createUser } from '../../../chunks/cosmic_-UWy_jvB.mjs';
import { h as hashPassword, c as createSessionToken, s as storeSession, a as setSessionCookie } from '../../../chunks/auth_Du1TDwjH.mjs';
import { nanoid } from 'nanoid';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const userType = formData.get("userType")?.toString();
    const businessName = formData.get("businessName")?.toString();
    console.log("Signup attempt:", { name, email, userType, businessName });
    if (!name || !email || !password || !userType) {
      return redirect("/signup?error=Missing required fields");
    }
    if (userType === "seller" && !businessName) {
      return redirect("/signup?error=Business name is required for sellers");
    }
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return redirect("/signup?error=Email already registered");
    }
    const passwordHash = await hashPassword(password);
    let user;
    let sellerProfile = null;
    if (userType === "seller") {
      const userData = {
        type: "users",
        title: name,
        slug: `user-${nanoid(10)}`,
        metadata: {
          name,
          email,
          password_hash: passwordHash,
          user_type: "seller",
          // Mark them as a seller
          business_name: businessName
          // Store business name reference
        }
      };
      console.log("Creating seller user account:", { name, email });
      user = await createUser(userData);
      console.log("Seller user account created:", user.id);
      const sellerData = {
        type: "sellers",
        title: businessName || `Seller - ${name}`,
        slug: `seller-${nanoid(10)}`,
        metadata: {
          business_name: businessName,
          email,
          user_id: user.id,
          // Link to user account
          store_description: "",
          stripe_account_id: "",
          stripe_onboarding_complete: false,
          phone: "",
          owner_name: name
        }
      };
      console.log("Creating seller profile:", { businessName, email });
      sellerProfile = await createUser(sellerData);
      console.log("Seller profile created:", sellerProfile.id);
    } else {
      const userData = {
        type: "users",
        title: name,
        slug: `user-${nanoid(10)}`,
        // Add explicit slug
        metadata: {
          name,
          email,
          password_hash: passwordHash,
          user_type: "buyer"
        }
      };
      console.log("Creating buyer with data:", JSON.stringify(userData, null, 2));
      user = await createUser(userData);
      console.log("Buyer created successfully:", user.id);
    }
    const sessionToken = createSessionToken();
    const session = {
      userId: user.id,
      email: user.metadata.email,
      userType,
      name: user.metadata.name || name
    };
    if (userType === "seller" && sellerProfile) {
      session.sellerId = sellerProfile.id;
      session.businessName = businessName;
    }
    console.log("Session created:", { userId: user.id, userType, name: session.name, sellerId: session.sellerId });
    storeSession(sessionToken, session);
    setSessionCookie(cookies, sessionToken, session);
    if (userType === "seller") {
      return redirect("/dashboard");
    }
    return redirect("/profile");
  } catch (error) {
    console.error("Signup error:", error);
    return redirect("/signup?error=Failed to create account");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
