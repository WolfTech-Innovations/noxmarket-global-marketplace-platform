# NoxMarket - Global Marketplace Platform

![NoxMarket Preview](https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=300&fit=crop&auto=format)

A sophisticated global marketplace platform powered by Cosmic CMS, featuring Stripe payment integration, user authentication, and a sleek black-and-white interface with smooth animations.

## Features

- 🛍️ **Product Marketplace** - Browse and search products with advanced filtering
- 💳 **Stripe Integration** - Secure payments with Stripe Connect for seller onboarding
- 👤 **User Authentication** - Complete login/signup system with protected routes
- 📊 **Seller Dashboard** - Manage products, view orders, and track sales
- 🔍 **Real-time Search** - Instant search with category and price filters
- 📱 **Responsive Design** - Optimized for all devices
- 🎨 **Modern UI** - Sleek black-and-white design with smooth animations
- 🔒 **Secure** - Password hashing and protected routes
- 📈 **SEO Optimized** - Dynamic meta tags, Open Graph, JSON-LD, sitemap
- 🚀 **Fast Performance** - Built with Astro for optimal speed

## Clone this Project

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=6931fa7e3584465d0a2f7c3b&clone_repository=6931fec23584465d0a2f7c70)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> "A global marketplace that uses the Stripe API for onboarding and payments that has a sleek and modern black against white interface with smooth animations and transitions called NoxMarket (By WolfTech Innovations) with seller and buyer sign up and login and listing and a way to pay sellers via Stripe and collect buyers info for the seller in a neat list in the seller dashboard"

### Code Generation Prompt

> "Set up an Astro website powered by my existing content which is A global marketplace that uses the Stripe API for onboarding and payments that has a sleek and modern black against white interface with smooth animations and transitions called NoxMarket (By WolfTech Innovations) with seller and buyer sign up and login and listing and a way to pay sellers via Stripe and collect buyers info for the seller in a neat list in the seller dashboard 
> 
> Create a user authentication system with login and signup using Cosmic to save the name, email, and password. Include protected routes and user profile management.
> 
> Add comprehensive SEO features including dynamic meta tags, Open Graph tags, JSON-LD structured data, sitemap generation, and robots.txt.
> 
> Implement a search feature that allows users to search through [content type] with real-time results and filters."

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## Technologies

- **Astro** - Modern static site builder
- **TypeScript** - Type-safe development
- **Cosmic CMS** - Headless CMS for content management
- **Stripe** - Payment processing and seller onboarding
- **Tailwind CSS** - Utility-first styling
- **bcryptjs** - Password hashing
- **nanoid** - Unique ID generation

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account with bucket configured
- Stripe account for payment processing

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Create a `.env` file in the root directory with your credentials:

```env
COSMIC_BUCKET_SLUG=your-bucket-slug
COSMIC_READ_KEY=your-read-key
COSMIC_WRITE_KEY=your-write-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
JWT_SECRET=your-jwt-secret-minimum-32-characters
```

4. Start the development server:

```bash
bun run dev
```

5. Open [http://localhost:4321](http://localhost:4321) in your browser

## Cosmic SDK Examples

### Fetching Products

```typescript
import { cosmic } from './lib/cosmic'

// Get all products with seller and category information
const { objects: products } = await cosmic.objects
  .find({ type: 'products' })
  .props(['id', 'title', 'slug', 'metadata'])
  .depth(1)

// Get a single product by slug
const { object: product } = await cosmic.objects
  .findOne({ type: 'products', slug: 'product-slug' })
  .depth(1)
```

### Creating Orders

```typescript
// Create a new order
await cosmic.objects.insertOne({
  type: 'orders',
  title: `Order ${orderNumber}`,
  metadata: {
    order_number: orderNumber,
    product: productId,
    seller: sellerId,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    shipping_address: shippingAddress,
    order_total: total,
    order_status: 'pending',
    payment_status: 'paid',
    stripe_payment_id: paymentIntentId
  }
})
```

### Managing Sellers

```typescript
// Update seller Stripe information
await cosmic.objects.updateOne(sellerId, {
  metadata: {
    stripe_account_id: accountId,
    stripe_onboarding_complete: true
  }
})
```

## Cosmic CMS Integration

This application uses your existing Cosmic content structure:

- **Products** - Product listings with images, pricing, and inventory
- **Sellers** - Seller profiles with Stripe integration
- **Categories** - Product categorization
- **Orders** - Order management and tracking
- **Users** (created dynamically) - User authentication data

All content is managed through your Cosmic dashboard, with the application fetching data via the Cosmic SDK.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Add environment variables in Netlify dashboard

### Environment Variables

Make sure to set these in your deployment platform:
- `COSMIC_BUCKET_SLUG`
- `COSMIC_READ_KEY`
- `COSMIC_WRITE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `JWT_SECRET`

<!-- README_END -->