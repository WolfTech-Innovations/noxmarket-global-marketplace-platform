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

    console.log('Updating seller settings:', {
      sellerId: session.sellerId,
      businessName
    });

    if (!businessName) {
      return redirect('/dashboard/settings?error=Business name is required');
    }

    // Update seller profile in Cosmic (preserve existing Stripe data)
    await cosmic.objects.updateOne(session.sellerId, {
      title: businessName,
      metadata: {
        business_name: businessName,
        store_description: storeDescription || '',
        phone: phone || ''
      }
    });

    console.log('Seller settings updated successfully');

    return redirect('/dashboard/settings?success=Settings saved successfully!');
  } catch (error) {
    console.error('Error updating seller settings:', error);
    return redirect('/dashboard/settings?error=Failed to save settings. Please try again.');
  }
};