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

    console.log('Creating product:', {
      productName,
      price,
      stockQuantity,
      sellerId: session.sellerId
    });

    if (!productName || !description || price <= 0) {
      return redirect('/dashboard/products/new?error=Please fill in all required fields');
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
        seller: session.sellerId
      }
    };

    // Add category if selected
    if (categoryId) {
      productData.metadata.category = categoryId;
    }

    // Create the product
    const response = await cosmic.objects.insertOne(productData);

    console.log('Product created successfully:', response.object.id);

    return redirect('/dashboard/products?success=Product added successfully!');
  } catch (error) {
    console.error('Error creating product:', error);
    return redirect('/dashboard/products/new?error=Failed to create product. Please try again.');
  }
};