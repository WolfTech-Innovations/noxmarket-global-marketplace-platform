// src/lib/seller.ts
import { cosmic } from '@/lib/cosmic';

export async function getStripeAccountId(sellerId: string): Promise<string | null> {
  try {
    const res = await cosmic.objects.findOne({ id: sellerId });
    return res?.object?.metadata?.stripe_account_id ?? null;
  } catch {
    return null;
  }
}
