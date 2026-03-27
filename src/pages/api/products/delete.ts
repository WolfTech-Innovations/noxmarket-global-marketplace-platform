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
    const productId = formData.get('product_id')?.toString();

    if (!productId) {
      return redirect('/dashboard/products?error=Product ID missing');
    }

    // Fetch product first to verify ownership and grab media ID for cleanup
    const { object: product } = await cosmic.objects.findOne({
      type: 'products',
      id: productId
    }).props('id,metadata');

    const sellerId = typeof product.metadata.seller === 'string'
      ? product.metadata.seller
      : product.metadata.seller?.id;

    if (sellerId !== session.sellerId) {
      return redirect('/dashboard/products?error=Unauthorized');
    }

    // Delete the object
    await cosmic.objects.deleteOne(productId);

    // Clean up attached media if present.
    // product_images is a file metafield — value is { name, url, imgix_url }.
    // The media.deleteOne API takes the media's `name` field as the identifier.
    const image = product.metadata?.product_images;
    if (image?.name) {
      try {
        // Look up the media record by name to get its ID, then delete
        const { media } = await cosmic.media.findOne({ name: image.name }).props('id');
        if (media?.id) {
          await cosmic.media.deleteOne(media.id);
        }
      } catch {
        // Media may have already been deleted or never fully uploaded — not fatal
        console.warn('Could not delete media for product:', productId);
      }
    }

    return redirect('/dashboard/products?success=Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    return redirect('/dashboard/products?error=Failed to delete product');
  }
};
