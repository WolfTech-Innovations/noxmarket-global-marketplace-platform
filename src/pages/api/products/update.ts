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

    // Parse form fields
    const productName = formData.get('product_name')?.toString();
    const description = formData.get('description')?.toString();
    const price = parseFloat(formData.get('price')?.toString() || '0');
    const stockQuantity = parseInt(formData.get('stock_quantity')?.toString() || '0');
    const categoryId = formData.get('category')?.toString();
    const inStock = formData.get('in_stock') === 'true';

    if (!productName || !description || price <= 0) {
      return redirect(`/dashboard/products/edit/${productId}?error=Please fill in all required fields`);
    }

    // Handle image uploads
    const imageFiles = formData.getAll('product_images');
    let productImages = existingProduct.object.metadata.product_images;

    // Filter out empty file inputs and check if we have real files
    const validFiles = imageFiles.filter((file): file is File => 
      file instanceof File && file.size > 0
    );

    if (validFiles.length > 0) {
      const uploadedImageNames = [];
      
      for (const file of validFiles) {
        try {
          // Convert File to Buffer for Node.js environment
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const uploadResult = await cosmic.media.insertOne({
            media: {
              buffer: buffer,
              originalname: file.name
            }
            // Don't use folder - they need to exist first
          });
          // CRITICAL: Store only the 'name' string for file metafields!
          uploadedImageNames.push(uploadResult.media.name);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      }
      
      if (uploadedImageNames.length > 0) {
        productImages = uploadedImageNames;
      }
    }

    // Get existing metadata and remove product_images from spread
    const { product_images, ...metadataWithoutImages } = existingProduct.object.metadata;

    // Build update data
    const updateData: any = {
      title: productName,
      metadata: {
        ...metadataWithoutImages,
        product_name: productName,
        description: description,
        price: price,
        stock_quantity: stockQuantity,
        in_stock: inStock,
        condition: formData.get('condition')?.toString() || 'good',
        benchmark_results: formData.get('benchmark_results')?.toString() || 'Not provided',
        testing_notes: formData.get('testing_notes')?.toString() || '',
        warranty_info: formData.get('warranty_info')?.toString() || '',
        socket_type: formData.get('socket_type')?.toString() || '',
        form_factor: formData.get('form_factor')?.toString() || '',
        power_requirements: formData.get('power_requirements')?.toString() || '',
        dimensions: formData.get('dimensions')?.toString() || '',
        product_images: productImages // Add back the images (new or existing)
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