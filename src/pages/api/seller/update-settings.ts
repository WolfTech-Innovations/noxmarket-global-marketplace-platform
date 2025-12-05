import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';
import { cosmic } from '@/lib/cosmic';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);

  if (!session || !session.isSeller || !session.sellerId) {
    return redirect('/login');
  }

  try {
    const formData = await request.formData();
    const businessName = formData.get('business_name')?.toString();
    const storeDescription = formData.get('store_description')?.toString();
    const phone = formData.get('phone')?.toString();
    const stripeAccountId = formData.get('stripe_account_id')?.toString();

    console.log('Updating seller settings:', {
      sellerId: session.sellerId,
      businessName,
      hasStripeId: !!stripeAccountId
    });

    if (!businessName) {
      return redirect('/dashboard/settings?error=Business name is required');
    }

    if (!stripeAccountId) {
      return redirect('/dashboard/settings?error=Stripe Account ID is required');
    }

    // Validate Stripe Account ID format
    if (!stripeAccountId.startsWith('acct_')) {
      return redirect('/dashboard/settings?error=Invalid Stripe Account ID format. It should start with "acct_"');
    }

    // Update seller profile in Cosmic
    await cosmic.objects.updateOne(session.sellerId, {
      title: businessName,
      metadata: {
        business_name: businessName,
        store_description: storeDescription || '',
        phone: phone || '',
        stripe_account_id: stripeAccountId,
        stripe_onboarding_complete: true
      }
    });

    console.log('Seller settings updated successfully');

    return redirect('/dashboard/settings?success=Settings saved successfully!');
  } catch (error) {
    console.error('Error updating seller settings:', error);
    return redirect('/dashboard/settings?error=Failed to save settings. Please try again.');
  }
};