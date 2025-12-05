import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
});

// Create Stripe Connect account for seller
export async function createConnectAccount(email: string) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    return account;
  } catch (error) {
    throw new Error('Failed to create Stripe account');
  }
}

// Create account link for onboarding
export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink;
  } catch (error) {
    throw new Error('Failed to create account link');
  }
}

// Create payment intent
export async function createPaymentIntent(amount: number, currency: string, connectedAccountId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card'],
      application_fee_amount: Math.round(amount * 100 * 0.1), // 10% platform fee
      transfer_data: {
        destination: connectedAccountId
      }
    });

    return paymentIntent;
  } catch (error) {
    throw new Error('Failed to create payment intent');
  }
}

// Check account status
export async function getAccountStatus(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted
    };
  } catch (error) {
    throw new Error('Failed to retrieve account status');
  }
}