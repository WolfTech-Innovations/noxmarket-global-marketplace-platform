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
    const productName = formData.get('product_name')?.toString();
    const description = formData.get('description')?.toString();
    const price = parseFloat(formData.get('price')?.toString() || '0');
    const stockQuantity = parseInt(formData.get('stock_quantity')?.toString() || '0');
    const categoryId = formData.get('category')?.toString();
    const inStock = formData.get('in_stock') === 'true';

    if (!productId || !productName || !description || price <= 0) {
      return redirect(`/dashboard/products/edit/${productId}?error=Please fill in all required fields`);
    }

    // Verify product belongs to this seller
    const existingProduct = await cosmic.objects.findOne({
      type: 'products',
      id: productId
    }).props('metadata');

    if (existingProduct.object.metadata.seller !== session.sellerId) {
      return redirect('/dashboard/products?error=Unauthorized');
    }

    // Update product
    const updateData: any = {
      title: productName,
      metadata: {
        product_name: productName,
        description: description,
        price: price,
        stock_quantity: stockQuantity,
        in_stock: inStock
      }
    };

    if (categoryId) {
      updateData.metadata.category = categoryId;
    }

    await cosmic.objects.updateOne(productId, updateData);

    console.log('Product updated successfully:', productId);

    return redirect('/dashboard/products?success=Product updated successfully!');
  } catch (error) {
    console.error('Error updating product:', error);
    return redirect('/dashboard/products?error=Failed to update product');
  }
};