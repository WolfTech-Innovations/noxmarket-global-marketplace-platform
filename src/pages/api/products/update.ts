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
    
    // PC-specific fields (optional, with defaults)
    const condition = formData.get('condition')?.toString() || 'good';
    const benchmarkResults = formData.get('benchmark_results')?.toString() || 'Not provided';
    const testingNotes = formData.get('testing_notes')?.toString() || '';
    const warrantyInfo = formData.get('warranty_info')?.toString() || '';
    const socketType = formData.get('socket_type')?.toString() || '';
    const formFactor = formData.get('form_factor')?.toString() || '';
    const powerRequirements = formData.get('power_requirements')?.toString() || '';
    const dimensions = formData.get('dimensions')?.toString() || '';

    if (!productId || !productName || !description || price <= 0) {
      return redirect(`/dashboard/products/edit/${productId}?error=Please fill in all required fields`);
    }

    // Verify product belongs to this seller
    const existingProduct = await cosmic.objects.findOne({
      type: 'products',
      id: productId
    }).props('metadata');

    const sellerId = typeof existingProduct.object.metadata.seller === 'string'
      ? existingProduct.object.metadata.seller
      : existingProduct.object.metadata.seller?.id;

    if (sellerId !== session.sellerId) {
      return redirect('/dashboard/products?error=Unauthorized');
    }

    // Get existing metadata to preserve fields we're not updating
    const existingMetadata = existingProduct.object.metadata;

    // Update product - merge with existing metadata to preserve everything
    const updateData: any = {
      title: productName,
      metadata: {
        ...existingMetadata, // Preserve all existing fields
        // Update specific fields
        product_name: productName,
        description: description,
        price: price,
        stock_quantity: stockQuantity,
        in_stock: inStock,
        // PC-specific verification fields (auto-created if missing)
        condition: condition,
        benchmark_results: benchmarkResults,
        testing_notes: testingNotes,
        warranty_info: warrantyInfo,
        // Compatibility fields (auto-created if missing)
        socket_type: socketType,
        form_factor: formFactor,
        power_requirements: powerRequirements,
        dimensions: dimensions
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