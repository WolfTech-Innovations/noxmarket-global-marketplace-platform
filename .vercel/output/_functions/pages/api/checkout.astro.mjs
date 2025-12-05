import { b as getProduct } from '../../chunks/cosmic_-UWy_jvB.mjs';
import { g as getSessionFromCookies } from '../../chunks/auth_Du1TDwjH.mjs';
import Stripe from 'stripe';
export { renderers } from '../../renderers.mjs';

const stripe = new Stripe(undefined                                 , {
  apiVersion: "2025-02-24.acacia"
});
const POST = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);
  if (!session) {
    return redirect("/login");
  }
  try {
    const formData = await request.formData();
    const productSlug = formData.get("productId")?.toString();
    const quantity = parseInt(formData.get("quantity")?.toString() || "1");
    console.log("Checkout attempt:", { productSlug, quantity, hasSession: !!session });
    if (!productSlug) {
      console.error("No product slug provided");
      return redirect("/products?error=Invalid product");
    }
    const product = await getProduct(productSlug);
    if (!product) {
      console.error("Product not found:", productSlug);
      return redirect("/products?error=Product not found");
    }
    console.log("Product found:", { name: product.metadata.product_name, price: product.metadata.price });
    if (!product.metadata.in_stock) {
      console.error("Product out of stock:", productSlug);
      return redirect(`/products/${product.slug}?error=Product out of stock`);
    }
    if (quantity > product.metadata.stock_quantity) {
      console.error("Insufficient stock:", { requested: quantity, available: product.metadata.stock_quantity });
      return redirect(`/products/${product.slug}?error=Not enough stock available`);
    }
    const baseUrl = new URL(request.url).origin;
    console.log("Creating Stripe checkout session...");
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.metadata.product_name,
              description: product.metadata.description?.substring(0, 500) || "",
              images: product.metadata.product_images?.[0]?.imgix_url ? [`${product.metadata.product_images[0].imgix_url}?w=500&h=500&fit=crop`] : []
            },
            unit_amount: Math.round(product.metadata.price * 100)
            // Convert to cents
          },
          quantity
        }
      ],
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/products/${product.slug}?error=Payment cancelled`,
      customer_email: session.email,
      metadata: {
        productId: product.id,
        productSlug: product.slug,
        userId: session.userId,
        quantity: quantity.toString()
      },
      // Optional: Add shipping address collection
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"]
        // Add countries you ship to
      }
    });
    console.log("Checkout session created:", checkoutSession.id);
    console.log("Redirecting to:", checkoutSession.url);
    return redirect(checkoutSession.url);
  } catch (error) {
    console.error("Checkout error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe error:", error.message);
      return redirect("/products?error=Payment system error");
    }
    return redirect("/products?error=Checkout failed");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
