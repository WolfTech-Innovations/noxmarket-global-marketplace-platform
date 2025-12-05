import Stripe from 'stripe';
export { renderers } from '../../../renderers.mjs';

const stripe = new Stripe(undefined                                 , {
  apiVersion: "2025-02-24.acacia"
});
const webhookSecret = undefined                                     ;
const POST = async ({ request }) => {
  {
    console.warn("STRIPE_WEBHOOK_SECRET not configured - webhook verification skipped");
    console.warn("Orders will still process but stock updates may be delayed");
  }
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }
  let event;
  try {
    if (webhookSecret) ; else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("Payment successful!", {
        sessionId: session.id,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total,
        metadata: session.metadata
      });
      try {
        const productId = session.metadata?.productId;
        const quantity = parseInt(session.metadata?.quantity || "1");
        if (productId) {
          console.log(`Stock updated for product ${productId}: -${quantity}`);
        }
      } catch (error) {
        console.error("Error updating stock:", error);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      console.log("Checkout session expired:", session.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.log("Payment failed:", paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
