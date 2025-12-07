export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'video' | 'book' | 'profile' | 'music.song' | 'music.album';
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock' | 'preorder' | 'discontinued';
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  category?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  sku?: string;
  gtin?: string;
  mpn?: string;
  condition?: 'new' | 'used' | 'refurbished';
  videoUrl?: string;
  audioDuration?: string;
  wordCount?: number;
  isbn?: string;
  language?: string;
  breadcrumbs?: Array<{name: string; url: string}>;
  faqItems?: Array<{question: string; answer: string}>;
}

export function generateMetaTags(seo: SEOProps) {
  const baseUrl = import.meta.env.SITE || 'https://nox.wolfos.uk';
  const fullUrl = seo.url ? `${baseUrl}${seo.url}` : baseUrl;
  const imageUrl = seo.image || `${baseUrl}/og-image.jpg`;
  const siteName = seo.siteName || 'Nox';
  const locale = seo.locale || 'en_US';
  const type = seo.type || 'website';
  const publishDate = seo.publishDate || new Date().toISOString();
  const modifiedDate = seo.modifiedDate || publishDate;
  const desc = seo.description.slice(0, 160);
  const titleOptimized = seo.title.slice(0, 60);

  return {
    title: titleOptimized,
    description: desc,
    keywords: seo.keywords?.join(', '),
    canonical: fullUrl,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    googlebot: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    bingbot: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
    'theme-color': '#ffffff',
    'format-detection': 'telephone=no',
    author: seo.author,
    'article:published_time': type === 'article' ? publishDate : undefined,
    'article:modified_time': type === 'article' ? modifiedDate : undefined,
    'article:author': type === 'article' ? seo.author : undefined,
    'article:section': type === 'article' ? seo.category : undefined,
    'article:tag': type === 'article' ? seo.tags?.join(', ') : undefined,
    'X-UA-Compatible': 'IE=edge',
    referrer: 'origin-when-cross-origin',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': siteName,
    'application-name': siteName,
    'msapplication-TileColor': '#ffffff',
    'msapplication-config': `${baseUrl}/browserconfig.xml`,
    'color-scheme': 'light dark',
    'supported-color-schemes': 'light dark',
    openGraph: {
      type: type,
      locale: locale,
      url: fullUrl,
      title: titleOptimized,
      description: desc,
      siteName: siteName,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: titleOptimized,
        type: 'image/jpeg'
      }],
      ...(type === 'article' && {
        publishedTime: publishDate,
        modifiedTime: modifiedDate,
        authors: seo.author ? [seo.author] : undefined,
        section: seo.category,
        tags: seo.tags
      }),
      ...(type === 'product' && seo.price && {
        price: {
          amount: seo.price,
          currency: seo.currency || 'USD'
        },
        availability: seo.availability || 'instock',
        brand: seo.brand,
        retailerId: seo.sku,
        condition: seo.condition || 'new'
      }),
      ...(type === 'video' && seo.videoUrl && {
        video: {
          url: seo.videoUrl,
          secureUrl: seo.videoUrl,
          type: 'video/mp4',
          width: 1920,
          height: 1080
        }
      }),
      ...(type === 'music.song' && seo.audioDuration && {
        audio: {
          url: seo.videoUrl,
          secureUrl: seo.videoUrl,
          type: 'audio/mpeg'
        },
        duration: seo.audioDuration
      }),
      ...(type === 'book' && {
        isbn: seo.isbn,
        authors: seo.author ? [seo.author] : undefined,
        releaseDate: publishDate
      })
    },
    twitter: {
      card: seo.videoUrl ? 'player' : 'summary_large_image',
      site: '@nox',
      creator: seo.author ? `@${seo.author}` : '@nox',
      title: titleOptimized,
      description: desc,
      image: imageUrl,
      imageAlt: titleOptimized,
      ...(seo.videoUrl && {
        player: seo.videoUrl,
        playerWidth: 1920,
        playerHeight: 1080
      })
    },
    facebook: {
      appId: '123456789'
    },
    additionalMetaTags: [
      {name: 'language', content: seo.language || 'English'},
      {name: 'revisit-after', content: '7 days'},
      {name: 'distribution', content: 'global'},
      {name: 'rating', content: 'general'},
      {name: 'coverage', content: 'Worldwide'},
      {name: 'target', content: 'all'},
      {name: 'HandheldFriendly', content: 'True'},
      {name: 'MobileOptimized', content: '320'},
      {name: 'geo.region', content: 'US'},
      {name: 'geo.placename', content: 'United States'},
      {name: 'ICBM', content: '37.7749,-122.4194'},
      {name: 'DC.title', content: titleOptimized},
      {name: 'DC.creator', content: seo.author || siteName},
      {name: 'DC.subject', content: seo.category || 'general'},
      {name: 'DC.description', content: desc},
      {name: 'DC.publisher', content: siteName},
      {name: 'DC.contributor', content: seo.author || siteName},
      {name: 'DC.date', content: publishDate},
      {name: 'DC.type', content: type},
      {name: 'DC.format', content: 'text/html'},
      {name: 'DC.identifier', content: fullUrl},
      {name: 'DC.language', content: seo.language || 'en'},
      {name: 'DC.coverage', content: 'World'},
      {name: 'DC.rights', content: `Copyright ${new Date().getFullYear()} ${siteName}`},
      {name: 'news_keywords', content: seo.keywords?.slice(0, 10).join(', ')},
      {name: 'original-source', content: fullUrl},
      {name: 'verify-v1', content: 'google-site-verification'},
      {name: 'alexaVerifyID', content: 'alexa-verification'},
      {name: 'yandex-verification', content: 'yandex-verification'},
      {name: 'p:domain_verify', content: 'pinterest-verification'},
      {name: 'norton-safeweb-site-verification', content: 'norton-verification'}
    ],
    additionalLinkTags: [
      {rel: 'canonical', href: fullUrl},
      {rel: 'alternate', hrefLang: 'en', href: fullUrl},
      {rel: 'alternate', hrefLang: 'x-default', href: fullUrl},
      {rel: 'alternate', type: 'application/rss+xml', title: `${siteName} RSS Feed`, href: `${baseUrl}/rss.xml`},
      {rel: 'alternate', type: 'application/atom+xml', title: `${siteName} Atom Feed`, href: `${baseUrl}/atom.xml`},
      {rel: 'sitemap', type: 'application/xml', href: `${baseUrl}/sitemap.xml`},
      {rel: 'manifest', href: `${baseUrl}/manifest.json`},
      {rel: 'icon', type: 'image/x-icon', href: `${baseUrl}/favicon.ico`},
      {rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseUrl}/favicon-32x32.png`},
      {rel: 'icon', type: 'image/png', sizes: '16x16', href: `${baseUrl}/favicon-16x16.png`},
      {rel: 'apple-touch-icon', sizes: '180x180', href: `${baseUrl}/apple-touch-icon.png`},
      {rel: 'mask-icon', href: `${baseUrl}/safari-pinned-tab.svg`, color: '#000000'},
      {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
      {rel: 'dns-prefetch', href: 'https://fonts.googleapis.com'},
      {rel: 'preload', href: `${baseUrl}/fonts/main.woff2`, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'},
      {rel: 'prefetch', href: `${baseUrl}/assets/main.js`},
      {rel: 'prerender', href: `${baseUrl}/next-page`}
    ]
  };
}

export function generateProductJsonLd(product: any, baseUrl: string) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/products/${product.slug}#product`,
    name: product.metadata.product_name,
    description: product.metadata.description,
    image: product.metadata.product_images?.map((img: any) => img.imgix_url) || [],
    sku: product.metadata.sku || product.slug,
    mpn: product.metadata.mpn,
    gtin: product.metadata.gtin,
    brand: {
      '@type': 'Brand',
      name: product.metadata.brand || 'Nox'
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: product.metadata.currency || 'USD',
      price: product.metadata.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.metadata.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: `https://schema.org/${product.metadata.condition || 'UsedCondition'}`,
      seller: {
        '@type': 'Organization',
        name: 'Nox',
        url: baseUrl
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          cutoffTime: '17:00:00',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY'
          }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      }
    },
    aggregateRating: product.metadata.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.metadata.rating,
      reviewCount: product.metadata.reviewCount || 1,
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    review: product.reviews?.map((rev: any) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rev.rating,
        bestRating: '5',
        worstRating: '1'
      },
      author: {
        '@type': 'Person',
        name: rev.author
      },
      reviewBody: rev.body,
      datePublished: rev.date
    })),
    category: product.metadata.category,
    additionalProperty: product.metadata.specs?.map((spec: any) => ({
      '@type': 'PropertyValue',
      name: spec.name,
      value: spec.value
    })),
    isRelatedTo: product.related?.map((rel: any) => ({
      '@type': 'Product',
      name: rel.name,
      url: `${baseUrl}/products/${rel.slug}`
    })),
    isSimilarTo: product.similar?.map((sim: any) => ({
      '@type': 'Product',
      name: sim.name,
      url: `${baseUrl}/products/${sim.slug}`
    }))
  };
  return schema;
}

export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'Nox',
    alternateName: 'Nox PC Parts',
    description: 'Used PC part market by WolfTech Innovations',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 600,
      height: 60
    },
    image: `${baseUrl}/logo.png`,
    sameAs: [ 'https://github.com/WolfTech-Innovations',
      ''
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+',
      contactType: 'customer service',
      email: 'support@wolfos.uk',
      areaServed: 'US',
      availableLanguage: ['en', 'es']
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94102',
      addressCountry: 'US'
    },
    founder: {
      '@type': 'Person',
      name: 'Christopher L Fox Jr'
    },
    foundingDate: '2022',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 3
    }
  };
}

export function generateWebsiteJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: 'Nox',
    description: 'Used PC part market by WolfTech Innovations',
    publisher: {
      '@id': `${baseUrl}#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'en-US'
  };
}

export function generateBreadcrumbJsonLd(breadcrumbs: Array<{name: string; url: string}>, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

export function generateArticleJsonLd(article: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}${article.url}#article`,
    headline: article.title,
    description: article.description,
    image: article.image || `${baseUrl}/og-image.jpg`,
    datePublished: article.publishDate,
    dateModified: article.modifiedDate || article.publishDate,
    author: {
      '@type': 'Person',
      name: article.author,
      url: `${baseUrl}/authors/${article.authorSlug}`
    },
    publisher: {
      '@id': `${baseUrl}#organization`
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${article.url}`
    },
    articleSection: article.category,
    keywords: article.keywords?.join(', '),
    wordCount: article.wordCount,
    inLanguage: 'en-US',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-content']
    }
  };
}

export function generateFAQJsonLd(faqItems: Array<{question: string; answer: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function generateLocalBusinessJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#localbusiness`,
    name: 'WolfTech Innovations',
    image: `${baseUrl}/logo.png`,
    telephone: '',
    email: 'support@wolfos.uk',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94102',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.7749,
      longitude: -122.4194
    },
    url: baseUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00'
      }
    ],
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '250'
    }
  };
}

export function generateVideoJsonLd(video: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.url,
    embedUrl: video.embedUrl,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WatchAction',
      userInteractionCount: video.views
    }
  };
}

export function generateAggregateRatingJsonLd(rating: number, reviewCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: rating,
    reviewCount: reviewCount,
    bestRating: 5,
    worstRating: 1
  };
}

export function generateOfferJsonLd(offer: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    url: `${baseUrl}${offer.url}`,
    priceCurrency: offer.currency || 'USD',
    price: offer.price,
    priceValidUntil: offer.validUntil,
    availability: offer.availability || 'https://schema.org/InStock',
    itemCondition: offer.condition || 'https://schema.org/NewCondition'
  };
}