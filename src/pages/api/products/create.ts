import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';
import { cosmic } from '@/lib/cosmic';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = getSessionFromCookies(cookies);

  if (!session || !session.isSeller || !session.sellerId) {
    return redirect('/login');
  }

  try {
    const formData = await request.formData();
    const productName = formData.get('product_name')?.toString();
    const description = formData.get('description')?.toString();
    const price = parseFloat(formData.get('price')?.toString() || '0');
    const stockQuantity = parseInt(formData.get('stock_quantity')?.toString() || '0');
    const categoryId = formData.get('category')?.toString();
    const inStock = formData.get('in_stock') === 'true';

    // PC-specific fields
    const condition = formData.get('condition')?.toString() || 'good';
    const benchmarkResults = formData.get('benchmark_results')?.toString() || 'Not provided';
    const testingNotes = formData.get('testing_notes')?.toString() || '';
    const warrantyInfo = formData.get('warranty_info')?.toString() || '';
    const socketType = formData.get('socket_type')?.toString() || '';
    const formFactor = formData.get('form_factor')?.toString() || '';
    const powerRequirements = formData.get('power_requirements')?.toString() || '';
    const dimensions = formData.get('dimensions')?.toString() || '';

    if (!productName || !description || price <= 0) {
      return redirect('/dashboard/products/new?error=Please fill in all required fields');
    }

    // Handle image uploads
    const imageFiles = formData.getAll('product_images');
    const uploadedImageNames = [];

    // Filter valid files
    const validFiles = imageFiles.filter((file): file is File => 
      file instanceof File && file.size > 0
    );

    for (const file of validFiles) {
      try {
        // Convert File to Buffer for Node.js environment
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResult = await cosmic.media.insertOne({
          media: {
            buffer: buffer,
            originalname: file.name
          },
          folder: 'product-images'
        });
        // Use the 'name' property for file metafields!
        uploadedImageNames.push(uploadResult.media.name);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
      }
    }

    // Require at least one image
    if (uploadedImageNames.length === 0) {
      return redirect('/dashboard/products/new?error=Please upload at least one product image');
    }

    // Create product data
    const productData: any = {
      type: 'products',
      title: productName,
      slug: `product-${nanoid(10)}`,
      metadata: {
        product_name: productName,
        description: description,
        price: price,
        stock_quantity: stockQuantity,
        in_stock: inStock,
        seller: session.sellerId,
        product_images: uploadedImageNames, // Add the uploaded image names
        condition: condition,
        benchmark_results: benchmarkResults,
        testing_notes: testingNotes,
        warranty_info: warrantyInfo,
        socket_type: socketType,
        form_factor: formFactor,
        power_requirements: powerRequirements,
        dimensions: dimensions,
        verified: true,
        escrow_eligible: true
      }
    };

    if (categoryId) {
      productData.metadata.category = categoryId;
    }

    const response = await cosmic.objects.insertOne(productData);

    console.log('Product created successfully:', response.object.id);

    return redirect('/dashboard/products?success=Product added successfully!');
  } catch (error) {
    console.error('Error creating product:', error);
    return redirect('/dashboard/products/new?error=Failed to create product. Please try again.');
  }
};