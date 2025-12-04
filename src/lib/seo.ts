export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: string;
}

export function generateMetaTags(seo: SEOProps) {
  const baseUrl = import.meta.env.SITE || 'https://noxmarket.com';
  const fullUrl = seo.url ? `${baseUrl}${seo.url}` : baseUrl;
  const imageUrl = seo.image || `${baseUrl}/og-image.jpg`;
  
  return {
    title: seo.title,
    description: seo.description,
    canonical: fullUrl,
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: fullUrl,
      type: seo.type || 'website',
      image: imageUrl
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      image: imageUrl
    }
  };
}

export function generateProductJsonLd(product: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.metadata.product_name,
    description: product.metadata.description,
    image: product.metadata.product_images?.[0]?.imgix_url || '',
    offers: {
      '@type': 'Offer',
      price: product.metadata.price,
      priceCurrency: 'USD',
      availability: product.metadata.in_stock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/products/${product.slug}`
    }
  };
}

export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NoxMarket',
    description: 'Global marketplace powered by WolfTech Innovations',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`
  };
}