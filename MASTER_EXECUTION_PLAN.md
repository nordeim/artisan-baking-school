# L'Artisan Baking Atelier: Master Execution Plan

## Executive Summary

This document provides a comprehensive, phased roadmap for building **L'Artisan Baking Atelier** - a full-stack e-commerce platform for a Singapore-based artisan baking school. The platform merges the "Artisanal Editorial" design philosophy (from existing plans) with a complete e-commerce system featuring course sales, student progress tracking, video learning platform, and administrative controls.

**Strategic Architecture:**

- **Frontend**: Next.js 16 with Tailwind CSS v4, Framer Motion animations, Radix UI primitives
- **Backend**: Next.js API routes with Prisma ORM + PostgreSQL
- **Payments**: Stripe integration with Singapore GST (9%) compliance
- **Auth**: JWT-based authentication with Jose library
- **Media**: Video course delivery with progress tracking
- **Design**: "Édition Boulangerie" design system (Bone, Burnt, Sourdough, Copper palette)

**Total Estimated Timeline**: 8-10 weeks (assuming 2-3 developers)

---

## Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Project Initialization

**Objective**: Set up development environment, database, and core configuration

| File                  | Description                                 | Interfaces                                                                                                              | Checklist                                                                                                                           |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `.env.local`          | Environment variables for all services      | `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `AWS_S3_*` | - [ ] All 12+ env vars defined<br>- [ ] .env.example created for team<br>- [ ] No secrets committed                                 |
| `.env.example`        | Template for environment setup              | Same as above (with placeholder values)                                                                                 | - [ ] Documented in README<br>- [ ] All required keys listed                                                                        |
| `docker-compose.yml`  | Local development stack                     | Services: PostgreSQL 16, Redis (optional caching), MinIO (S3-compatible local storage)                                  | - [ ] PostgreSQL 16 container<br>- [ ] Persistent volumes<br>- [ ] Health checks configured                                         |
| `next.config.ts`      | Next.js configuration with security headers | `NextConfig` with `images.remotePatterns`, `headers()` for security, `rewrites()` if needed                             | - [ ] Security headers (CSP, X-Frame-Options, etc.)<br>- [ ] Image domains whitelisted<br>- [ ] Turbopack enabled                   |
| `tsconfig.json`       | TypeScript strict configuration             | `compilerOptions.strict: true`, `paths` for `@/*` aliases                                                               | - [ ] Strict mode enabled<br>- [ ] No `any` types allowed<br>- [ ] Path aliases configured                                          |
| `tailwind.config.ts`  | Tailwind v4 CSS-first configuration         | `@theme` directive with custom colors, fonts, animations                                                                | - [ ] Bone, Burnt, Sourdough, Copper color tokens<br>- [ ] Playfair Display + Inter fonts<br>- [ ] Custom spring animations defined |
| `postcss.config.mjs`  | PostCSS configuration                       | `@tailwindcss/postcss` plugin only                                                                                      | - [ ] Tailwind v4 plugin<br>- [ ] No legacy plugins                                                                                 |
| `src/app/globals.css` | Global styles with design tokens            | `@import "tailwindcss"`, `@theme` block, `@layer base`                                                                  | - [ ] CSS-first Tailwind v4 syntax<br>- [ ] 60-30-10 color rule applied<br>- [ ] Typography scale defined                           |
| `src/app/layout.tsx`  | Root layout with providers                  | `metadata`, `fonts`, `Providers` wrapper, analytics scripts                                                             | - [ ] Google Fonts loaded<br>- [ ] Metadata for SEO<br>- [ ] Viewport meta configured                                               |
| `src/lib/utils.ts`    | Utility functions                           | `cn()` for class merging, `formatCurrency()`, `formatDate()`                                                            | - [ ] `tailwind-merge` + `clsx` combo<br>- [ ] Currency formatting (SGD)<br>- [ ] Date formatting with date-fns                     |
| `src/middleware.ts`   | Next.js middleware for auth/routing         | `matcher` config, JWT validation, route protection logic                                                                | - [ ] Public routes whitelist<br>- [ ] JWT verification<br>- [ ] Redirect unauthorized users                                        |

**Validation Checkpoint:**

- [ ] `npm run dev` starts without errors
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` completes successfully
- [ ] Docker compose brings up PostgreSQL
- [ ] Prisma can connect to database

---

### 1.2 Database Schema Design

**Objective**: Define complete Prisma schema for e-commerce domain

| File                                        | Description              | Interfaces                                                                                                               | Checklist                                                                                                                            |
| ------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `prisma/schema.prisma`                      | Complete database schema | Models: `User`, `Course`, `Order`, `OrderItem`, `Cart`, `CartItem`, `Progress`, `Video`, `Review`, `Category`, `Payment` | - [ ] All 10+ models defined<br>- [ ] Relations properly mapped<br>- [ ] Indexing strategy applied<br>- [ ] Singapore GST field (9%) |
| `prisma/migrations/0001_init/migration.sql` | Initial migration        | SQL DDL statements                                                                                                       | - [ ] Migration generated via `prisma migrate dev`<br>- [ ] SQL reviewed for optimization                                            |
| `prisma/seed.ts`                            | Database seeding script  | Seed data: 4 courses, 2 categories, sample user, sample order                                                            | - [ ] 4+ realistic courses seeded<br>- [ ] Categories: Bread, Pastry<br>- [ ] Sample orders for testing                              |
| `src/lib/prisma.ts`                         | Prisma client singleton  | `prisma` instance with connection pooling                                                                                | - [ ] Singleton pattern<br>- [ ] Connection limits configured<br>- [ ] Error handling                                                |

**Schema Models Overview:**

```typescript
// Core Models
User {
  id, email, name, passwordHash, role(ADMIN|STUDENT),
  createdAt, updatedAt,
  orders[], cart?, progress[], reviews[]
}

Course {
  id, title, slug, description, shortDescription,
  price, compareAtPrice, gstIncluded(Boolean),
  categoryId, images[], curriculum[],
  videoCount, duration, level(BEGINNER|INTERMEDIATE|ADVANCED),
  featured(Boolean), published(Boolean),
  stock(optional for digital), lowStockThreshold,
  metaTitle, metaDescription,
  createdAt, updatedAt,
  category, orders[], cartItems[], progress[], reviews[]
}

Category {
  id, name, slug, description, image,
  courses[], createdAt, updatedAt
}

Order {
  id, orderNumber, userId, status,
  subtotal, gstAmount(9%), discountAmount, total,
  currency(SGD), stripePaymentIntentId,
  customerEmail, customerName,
  billingAddress{}, createdAt, updatedAt,
  user, items[], payment?
}

OrderItem {
  id, orderId, courseId, quantity, unitPrice, total,
  order, course
}

Cart {
  id, userId?, sessionId?, createdAt, updatedAt,
  user, items[]
}

CartItem {
  id, cartId, courseId, quantity,
  cart, course
}

Progress {
  id, userId, courseId, videoId,
  completed(Boolean), progressPercent, lastPositionSeconds,
  completedAt, updatedAt,
  user, course, video
}

Video {
  id, courseId, title, description, durationSeconds,
  videoUrl, thumbnailUrl, orderIndex, published(Boolean),
  course, progress[]
}

Review {
  id, userId, courseId, rating(1-5), content,
  createdAt, updatedAt,
  user, course
}
```

**Validation Checkpoint:**

- [ ] `prisma generate` succeeds
- [ ] `prisma migrate dev` applies cleanly
- [ ] `prisma db seed` populates data
- [ ] All models queryable in Prisma Studio

---

### 1.3 Core Types & Validation Schemas

**Objective**: Define TypeScript types and Zod schemas for type safety

| File                              | Description                | Interfaces                                                        | Checklist                                                                                                |
| --------------------------------- | -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/types/index.ts`              | Global TypeScript types    | `User`, `Course`, `Order`, `Cart`, `Progress`, API response types | - [ ] Strict typing (no `any`)<br>- [ ] Reusable across frontend/backend<br>- [ ] Enums for status/roles |
| `src/lib/validations/auth.ts`     | Authentication Zod schemas | `loginSchema`, `registerSchema`, `resetPasswordSchema`            | - [ ] Email validation<br>- [ ] Password strength rules<br>- [ ] Error messages i18n-ready               |
| `src/lib/validations/course.ts`   | Course Zod schemas         | `createCourseSchema`, `updateCourseSchema`, `courseFilterSchema`  | - [ ] Price validation (min 0)<br>- [ ] Slug validation (URL-safe)<br>- [ ] Curriculum structure         |
| `src/lib/validations/cart.ts`     | Cart Zod schemas           | `addToCartSchema`, `updateCartItemSchema`, `cartSchema`           | - [ ] Quantity limits<br>- [ ] Course exists validation                                                  |
| `src/lib/validations/checkout.ts` | Checkout Zod schemas       | `checkoutSchema`, `paymentSchema`, `shippingSchema`               | - [ ] GST calculation<br>- [ ] Singapore address format                                                  |
| `src/lib/validations/review.ts`   | Review Zod schemas         | `createReviewSchema`, `updateReviewSchema`                        | - [ ] Rating 1-5 only<br>- [ ] Content min/max length                                                    |

**Validation Checkpoint:**

- [ ] All schemas parse test data correctly
- [ ] Type inference works with `z.infer<typeof schema>`
- [ ] Error messages are user-friendly

---

## Phase 2: Authentication & User Management (Week 2-3)

### 2.1 Authentication System

**Objective**: Implement secure JWT-based authentication with PDPA compliance

| File                                        | Description                 | Interfaces                                                         | Checklist                                                                                                 |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/lib/auth/jwt.ts`                       | JWT utilities               | `signJWT()`, `verifyJWT()`, `refreshJWT()`                         | - [ ] Jose library implementation<br>- [ ] RS256 or HS256 algorithm<br>- [ ] 7-day expiry, 30-day refresh |
| `src/lib/auth/password.ts`                  | Password hashing            | `hashPassword()`, `verifyPassword()`                               | - [ ] bcryptjs with salt rounds 12<br>- [ ] Constant-time comparison                                      |
| `src/lib/auth/session.ts`                   | Session management          | `createSession()`, `getSession()`, `destroySession()`              | - [ ] HttpOnly cookies<br>- [ ] Secure flag (production)<br>- [ ] SameSite=Strict                         |
| `src/lib/auth/pdpa.ts`                      | PDPA compliance utilities   | `consentFormData`, `logDataAccess()`, `anonymizeUser()`            | - [ ] Consent tracking<br>- [ ] Data access logging<br>- [ ] Right to deletion                            |
| `src/app/api/auth/register/route.ts`        | Registration API            | POST /api/auth/register                                            | - [ ] Email uniqueness check<br>- [ ] Password hashing<br>- [ ] Welcome email sent                        |
| `src/app/api/auth/login/route.ts`           | Login API                   | POST /api/auth/login                                               | - [ ] Credential validation<br>- [ ] JWT issuance<br>- [ ] Failed attempt logging                         |
| `src/app/api/auth/logout/route.ts`          | Logout API                  | POST /api/auth/logout                                              | - [ ] Cookie clearing<br>- [ ] Session invalidation                                                       |
| `src/app/api/auth/me/route.ts`              | Current user API            | GET /api/auth/me                                                   | - [ ] JWT validation<br>- [ ] User data return (sanitized)                                                |
| `src/app/api/auth/forgot-password/route.ts` | Password reset request      | POST /api/auth/forgot-password                                     | - [ ] Token generation<br>- [ ] Email with reset link                                                     |
| `src/app/api/auth/reset-password/route.ts`  | Password reset execution    | POST /api/auth/reset-password                                      | - [ ] Token validation<br>- [ ] Password update                                                           |
| `src/hooks/useAuth.ts`                      | Authentication React hook   | `useAuth()` returns `{ user, login, logout, register, isLoading }` | - [ ] SWR or React Query integration<br>- [ ] Auto-refresh token<br>- [ ] Error handling                  |
| `src/components/auth/LoginForm.tsx`         | Login form component        | `LoginFormProps { onSuccess? }`                                    | - [ ] react-hook-form + zod<br>- [ ] Loading states<br>- [ ] Error display                                |
| `src/components/auth/RegisterForm.tsx`      | Registration form component | `RegisterFormProps { onSuccess? }`                                 | - [ ] Password strength indicator<br>- [ ] Terms acceptance<br>- [ ] PDPA consent checkbox                |
| `src/components/auth/ProtectedRoute.tsx`    | Route protection HOC        | `ProtectedRouteProps { children, allowedRoles? }`                  | - [ ] JWT validation check<br>- [ ] Redirect to login<br>- [ ] Role-based access                          |
| `src/app/login/page.tsx`                    | Login page                  | Page component                                                     | - [ ] Form centered<br>- [ ] Link to register<br>- [ ] Password reset link                                |
| `src/app/register/page.tsx`                 | Registration page           | Page component                                                     | - [ ] Form centered<br>- [ ] Link to login<br>- [ ] PDPA notice                                           |

**Validation Checkpoint:**

- [ ] Registration creates user with hashed password
- [ ] Login issues valid JWT
- [ ] Protected routes redirect unauthorized users
- [ ] JWT refresh works seamlessly
- [ ] PDPA consent stored and tracked
- [ ] Password reset flow complete
- [ ] Rate limiting on auth endpoints (Redis or in-memory)

---

### 2.2 User Profile & Account

**Objective**: User dashboard for order history, course access, and profile management

| File                                              | Description               | Interfaces                                     | Checklist                                                                            |
| ------------------------------------------------- | ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/api/users/[id]/route.ts`                 | User CRUD API             | GET, PUT, DELETE /api/users/[id]               | - [ ] Self or admin only<br>- [ ] Data sanitization                                  |
| `src/app/api/users/[id]/orders/route.ts`          | User orders API           | GET /api/users/[id]/orders                     | - [ ] Pagination<br>- [ ] Sort by date                                               |
| `src/app/api/users/[id]/courses/route.ts`         | User's purchased courses  | GET /api/users/[id]/courses                    | - [ ] Enrolled courses only<br>- [ ] Progress included                               |
| `src/app/dashboard/page.tsx`                      | User dashboard page       | Page component                                 | - [ ] Overview stats<br>- [ ] Recent orders<br>- [ ] Course progress                 |
| `src/app/dashboard/orders/page.tsx`               | Order history page        | Page component                                 | - [ ] Order list<br>- [ ] Status badges<br>- [ ] Invoice download                    |
| `src/app/dashboard/courses/page.tsx`              | My courses page           | Page component                                 | - [ ] Course cards<br>- [ ] Progress bars<br>- [ ] Continue learning CTA             |
| `src/app/dashboard/profile/page.tsx`              | Profile management page   | Page component                                 | - [ ] Edit profile form<br>- [ ] Change password<br>- [ ] PDPA data export           |
| `src/components/dashboard/DashboardLayout.tsx`    | Dashboard shell component | `DashboardLayoutProps { children }`            | - [ ] Sidebar navigation<br>- [ ] Mobile responsive<br>- [ ] Active state indicators |
| `src/components/dashboard/OrderCard.tsx`          | Order summary component   | `OrderCardProps { order }`                     | - [ ] Order number, date, total<br>- [ ] Status badge<br>- [ ] View details link     |
| `src/components/dashboard/CourseProgressCard.tsx` | Course with progress      | `CourseProgressCardProps { course, progress }` | - [ ] Thumbnail, title<br>- [ ] Progress bar<br>- [ ] Continue button                |

**Validation Checkpoint:**

- [ ] Users can view order history
- [ ] Order details accessible
- [ ] Profile updates persist
- [ ] Password change works
- [ ] Dashboard responsive on mobile
- [ ] Only own data accessible (authorization check)

---

## Phase 3: Product Catalog & Storefront (Week 3-4)

### 3.1 Course Catalog System

**Objective**: Complete course browsing, filtering, and display

| File                                             | Description               | Interfaces                                             | Checklist                                                                                                      |
| ------------------------------------------------ | ------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/lib/services/course.ts`                     | Course service layer      | `getCourses()`, `getCourseBySlug()`, `searchCourses()` | - [ ] Database queries optimized<br>- [ ] Caching strategy<br>- [ ] Error handling                             |
| `src/app/api/courses/route.ts`                   | Courses list API          | GET /api/courses (with filters)                        | - [ ] Pagination (cursor or offset)<br>- [ ] Category filter<br>- [ ] Price range filter<br>- [ ] Sort options |
| `src/app/api/courses/[slug]/route.ts`            | Single course API         | GET /api/courses/[slug]                                | - [ ] Full course data<br>- [ ] Related courses<br>- [ ] Reviews included                                      |
| `src/app/api/categories/route.ts`                | Categories API            | GET /api/categories                                    | - [ ] All categories<br>- [ ] Course counts                                                                    |
| `src/app/courses/page.tsx`                       | Course listing page       | Page component                                         | - [ ] Filter sidebar<br>- [ ] Course grid<br>- [ ] Pagination                                                  |
| `src/app/courses/[slug]/page.tsx`                | Course detail page        | Page component with generateMetadata                   | - [ ] Hero with video/image<br>- [ ] Curriculum accordion<br>- [ ] Reviews section<br>- [ ] Add to cart CTA    |
| `src/components/courses/CourseCard.tsx`          | Course card component     | `CourseCardProps { course, variant }`                  | - [ ] Image, title, price<br>- [ ] Category badge<br>- [ ] Hover spring animation                              |
| `src/components/courses/CourseGrid.tsx`          | Course grid container     | `CourseGridProps { courses, columns? }`                | - [ ] Responsive columns<br>- [ ] Bento layout option<br>- [ ] Loading skeleton                                |
| `src/components/courses/CourseFilter.tsx`        | Filter sidebar component  | `CourseFilterProps { filters, onChange }`              | - [ ] Category checkboxes<br>- [ ] Price slider<br>- [ ] Level filter                                          |
| `src/components/courses/CurriculumAccordion.tsx` | Course curriculum display | `CurriculumAccordionProps { modules }`                 | - [ ] Module list<br>- [ ] Lesson durations<br>- [ ] Preview indicators                                        |
| `src/components/courses/ReviewSection.tsx`       | Reviews display           | `ReviewSectionProps { reviews, courseId }`             | - [ ] Average rating<br>- [ ] Review cards<br>- [ ] Write review CTA                                           |
| `src/components/courses/RelatedCourses.tsx`      | Related courses component | `RelatedCoursesProps { courseId }`                     | - [ ] Same category<br>- [ ] Excludes current course                                                           |

**SEO Implementation:**

- [ ] `generateMetadata()` for course pages
- [ ] JSON-LD structured data (Course schema)
- [ ] Open Graph tags
- [ ] Canonical URLs
- [ ] XML sitemap generation

**Validation Checkpoint:**

- [ ] Course listing loads with filters
- [ ] Individual course pages render
- [ ] Curriculum displays correctly
- [ ] Reviews visible
- [ ] SEO meta tags present
- [ ] Images lazy loaded

---

### 3.2 Homepage & Marketing Sections

**Objective**: Landing page with "Artisanal Editorial" design from existing plans

| File                                          | Description            | Interfaces                                                 | Checklist                                                                                                                           |
| --------------------------------------------- | ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/page.tsx`                            | Homepage               | Page component with all sections                           | - [ ] Hero with asymmetric layout<br>- [ ] Featured courses bento grid<br>- [ ] Testimonials<br>- [ ] Mentors<br>- [ ] CTA sections |
| `src/components/home/HeroSection.tsx`         | Hero section           | `HeroSectionProps`                                         | - [ ] Playfair Display typography<br>- [ ] Spring animations<br>- [ ] Color palette applied                                         |
| `src/components/home/FeaturedCourses.tsx`     | Featured courses grid  | `FeaturedCoursesProps { courses }`                         | - [ ] Bento grid layout<br>- [ ] Asymmetric placement<br>- [ ] Hover interactions                                                   |
| `src/components/home/TestimonialsSection.tsx` | Testimonials           | `TestimonialsSectionProps { testimonials }`                | - [ ] Carousel or grid<br>- [ ] Spring physics animation<br>- [ ] Avatar, quote, name                                               |
| `src/components/home/MentorsSection.tsx`      | Instructors showcase   | `MentorsSectionProps { mentors }`                          | - [ ] Photo, name, bio<br>- [ ] Expertise tags                                                                                      |
| `src/components/home/CTASection.tsx`          | Call-to-action section | `CTASectionProps { title, description, buttonText, href }` | - [ ] Guide download form<br>- [ ] Email capture<br>- [ ] Success state                                                             |
| `src/components/home/BentoGrid.tsx`           | Reusable bento grid    | `BentoGridProps { children, areas }`                       | - [ ] CSS Grid template areas<br>- [ ] Responsive collapse                                                                          |
| `src/components/shared/SpringCard.tsx`        | Spring-animated card   | `SpringCardProps { children, stiffness?, damping? }`       | - [ ] Hooke's Law physics<br>- [ ] `prefers-reduced-motion` support<br>- [ ] Hover scale effect                                     |

**Design Implementation (from plan-2.md & plan-3.md):**

Color System (HSB-derived):

```css
--color-bone: hsl(42, 15%, 94%);
--color-bone-dark: hsl(42, 18%, 86%);
--color-sourdough: hsl(32, 40%, 72%);
--color-sourdough-dark: hsl(32, 45%, 60%);
--color-burnt: hsl(18, 65%, 28%);
--color-burnt-light: hsl(18, 40%, 40%);
--color-copper: hsl(21, 50%, 52%);
```

Typography:

- Headlines: Playfair Display (serif)
- Body: Inter / Geist Sans

Spring Animation Parameters:

- Stiffness: 150-220
- Damping: 18-25
- Mass: 1

**Validation Checkpoint:**

- [ ] Homepage matches design spec
- [ ] Bento grid responsive
- [ ] Spring animations smooth (60fps)
- [ ] Color contrast WCAG AAA compliant
- [ ] `prefers-reduced-motion` respected

---

## Phase 4: Shopping Cart & Checkout (Week 4-5)

### 4.1 Cart System

**Objective**: Persistent cart with localStorage, cross-tab sync

| File                                      | Description              | Interfaces                                                                        | Checklist                                                                                      |
| ----------------------------------------- | ------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/lib/services/cart.ts`                | Cart service layer       | `getCart()`, `addToCart()`, `updateCartItem()`, `removeCartItem()`, `clearCart()` | - [ ] Guest cart (localStorage)<br>- [ ] Authenticated cart (database)<br>- [ ] Merge on login |
| `src/lib/store/cart.ts`                   | Zustand cart store       | `CartState`, `CartActions`                                                        | - [ ] `persist` middleware<br>- [ ] Sync across tabs<br>- [ ] Optimistic updates               |
| `src/app/api/cart/route.ts`               | Cart API (authenticated) | GET, POST /api/cart                                                               | - [ ] CRUD operations<br>- [ ] Stock validation                                                |
| `src/app/api/cart/items/[id]/route.ts`    | Cart item operations     | PUT, DELETE /api/cart/items/[id]                                                  | - [ ] Quantity update<br>- [ ] Remove item                                                     |
| `src/components/cart/CartProvider.tsx`    | Cart context/provider    | `CartProviderProps { children }`                                                  | - [ ] Store initialization<br>- [ ] Hydration handling                                         |
| `src/components/cart/CartButton.tsx`      | Cart icon with badge     | `CartButtonProps`                                                                 | - [ ] Item count badge<br>- [ ] Spring animation<br>- [ ] Drawer trigger                       |
| `src/components/cart/CartDrawer.tsx`      | Slide-out cart drawer    | `CartDrawerProps { open, onClose }`                                               | - [ ] Item list<br>- [ ] Quantity controls<br>- [ ] Subtotal, GST, Total                       |
| `src/components/cart/CartItem.tsx`        | Cart line item           | `CartItemProps { item, onUpdate, onRemove }`                                      | - [ ] Thumbnail, title<br>- [ ] Price, quantity<br>- [ ] Remove button                         |
| `src/components/cart/AddToCartButton.tsx` | Add to cart CTA          | `AddToCartButtonProps { courseId, variant? }`                                     | - [ ] Loading state<br>- [ ] Success feedback<br>- [ ] Error handling                          |

**Validation Checkpoint:**

- [ ] Items persist in localStorage (guest)
- [ ] Items persist in database (authenticated)
- [ ] Cart syncs across browser tabs
- [ ] Cart merges on login
- [ ] GST calculated correctly (9%)
- [ ] Stock validation prevents oversell

---

### 4.2 Checkout & Payments

**Objective**: Stripe integration with Singapore GST compliance

| File                                         | Description             | Interfaces                                                         | Checklist                                                                     |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `src/lib/services/checkout.ts`               | Checkout service        | `createCheckoutSession()`, `processPayment()`, `calculateTotals()` | - [ ] GST calculation (9%)<br>- [ ] Line items with GST breakdown             |
| `src/lib/services/payment.ts`                | Payment service         | `createPaymentIntent()`, `confirmPayment()`, `refundPayment()`     | - [ ] Stripe integration<br>- [ ] 3D Secure support<br>- [ ] Webhook handling |
| `src/lib/services/email.ts`                  | Email service           | `sendOrderConfirmation()`, `sendCourseAccessEmail()`               | - [ ] Resend integration<br>- [ ] HTML templates                              |
| `src/app/api/checkout/route.ts`              | Checkout API            | POST /api/checkout                                                 | - [ ] Cart validation<br>- [ ] Stock check<br>- [ ] Stripe session creation   |
| `src/app/api/payment/route.ts`               | Payment intent API      | POST /api/payment                                                  | - [ ] Intent creation<br>- [ ] Client secret return                           |
| `src/app/api/webhooks/stripe/route.ts`       | Stripe webhook handler  | POST /api/webhooks/stripe                                          | - [ ] Signature verification<br>- [ ] Event processing<br>- [ ] Idempotency   |
| `src/app/api/orders/route.ts`                | Order creation API      | POST /api/orders                                                   | - [ ] Post-payment order creation<br>- [ ] Course enrollment                  |
| `src/app/checkout/page.tsx`                  | Checkout page           | Page component                                                     | - [ ] Order summary<br>- [ ] Stripe Elements<br>- [ ] Guest checkout option   |
| `src/app/checkout/success/page.tsx`          | Success page            | Page component                                                     | - [ ] Thank you message<br>- [ ] Order details<br>- [ ] Course access CTA     |
| `src/app/checkout/cancel/page.tsx`           | Cancelled page          | Page component                                                     | - [ ] Cancelled notice<br>- [ ] Retry CTA<br>- [ ] Cart preserved             |
| `src/components/checkout/CheckoutForm.tsx`   | Stripe payment form     | `CheckoutFormProps { clientSecret, order }`                        | - [ ] Card Element<br>- [ ] Billing details<br>- [ ] Submit handling          |
| `src/components/checkout/OrderSummary.tsx`   | Order summary sidebar   | `OrderSummaryProps { cart, gstRate }`                              | - [ ] Item list<br>- [ ] Subtotal, GST (9%), Total<br>- [ ] GST breakdown     |
| `src/components/checkout/StripeProvider.tsx` | Stripe Elements wrapper | `StripeProviderProps { children, clientSecret }`                   | - [ ] Publishable key config<br>- [ ] Appearance customization                |

**Singapore GST Implementation:**

```typescript
// GST calculation (9%)
const calculateGST = (subtotal: number): number => {
  return Math.round(subtotal * 0.09 * 100) / 100;
};

// Display format
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
};
```

**Validation Checkpoint:**

- [ ] Checkout creates Stripe session
- [ ] GST calculated at 9%
- [ ] Payment succeeds end-to-end
- [ ] Order created post-payment
- [ ] Email confirmation sent
- [ ] Webhooks process correctly
- [ ] Order confirmation page displays
- [ ] Guest checkout works
- [ ] 3D Secure supported

---

## Phase 5: Learning Platform (Week 5-6)

### 5.1 Video Course Player

**Objective**: Video lessons with progress tracking and resume capability

| File                                            | Description               | Interfaces                                                     | Checklist                                                                                   |
| ----------------------------------------------- | ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/lib/services/progress.ts`                  | Progress service          | `updateProgress()`, `getProgress()`, `markComplete()`          | - [ ] Watch time tracking<br>- [ ] Resume position<br>- [ ] Completion detection            |
| `src/lib/services/video.ts`                     | Video service             | `getVideoUrl()`, `getVideosByCourse()`                         | - [ ] URL signing (if needed)<br>- [ ] CORS handling                                        |
| `src/app/api/progress/route.ts`                 | Progress API              | POST /api/progress                                             | - [ ] Save progress<br>- [ ] Batch updates                                                  |
| `src/app/api/courses/[id]/videos/route.ts`      | Course videos API         | GET /api/courses/[id]/videos                                   | - [ ] All videos for course<br>- [ ] Progress included                                      |
| `src/app/learn/[courseSlug]/page.tsx`           | Course learning page      | Page component                                                 | - [ ] Video player<br>- [ ] Lesson sidebar<br>- [ ] Progress bar                            |
| `src/app/learn/[courseSlug]/[videoId]/page.tsx` | Video lesson page         | Page component                                                 | - [ ] Video player<br>- [ ] Navigation<br>- [ ] Mark complete                               |
| `src/components/learn/VideoPlayer.tsx`          | Custom video player       | `VideoPlayerProps { src, onProgress, onComplete }`             | - [ ] HTML5 Video API<br>- [ ] Progress tracking (5s intervals)<br>- [ ] Keyboard shortcuts |
| `src/components/learn/LessonSidebar.tsx`        | Lesson navigation         | `LessonSidebarProps { course, currentVideoId, progress }`      | - [ ] Module list<br>- [ ] Completion checkmarks<br>- [ ] Locked/unlocked states            |
| `src/components/learn/ProgressBar.tsx`          | Course progress indicator | `ProgressBarProps { percent, completedLessons, totalLessons }` | - [ ] Visual bar<br>- [ ] Percentage text                                                   |
| `src/components/learn/CourseCompleteModal.tsx`  | Completion celebration    | `CourseCompleteModalProps { course, onClose }`                 | - [ ] Congratulations message<br>- [ ] Certificate download CTA<br>- [ ] Share achievement  |
| `src/components/learn/NoteTaking.tsx`           | Lesson notes (optional)   | `NoteTakingProps { videoId }`                                  | - [ ] Timestamped notes<br>- [ ] Save to account                                            |

**Progress Tracking Implementation:**

```typescript
// Save progress every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (videoRef.current) {
      saveProgress({
        videoId,
        positionSeconds: videoRef.current.currentTime,
        completed:
          videoRef.current.currentTime >= videoRef.current.duration * 0.9,
      });
    }
  }, 5000);

  return () => clearInterval(interval);
}, [videoId]);
```

**Validation Checkpoint:**

- [ ] Videos load and play
- [ ] Progress saves every 5 seconds
- [ ] Resume works (returns to saved position)
- [ ] 90% watched = complete
- [ ] Sidebar shows progress
- [ ] Next lesson auto-advances

---

### 5.2 Gamification & Achievements

**Objective**: Progress dashboard with badges and streaks

| File                                                  | Description             | Interfaces                                                     | Checklist                                                                                                            |
| ----------------------------------------------------- | ----------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/lib/services/achievements.ts`                    | Achievements service    | `checkAchievements()`, `getUserAchievements()`, `awardBadge()` | - [ ] Badge rules<br>- [ ] Award detection<br>- [ ] Notification                                                     |
| `src/lib/data/achievements.ts`                        | Achievement definitions | `Achievement[]` with criteria                                  | - [ ] First course complete<br>- [ ] 5 courses complete<br>- [ ] 7-day streak<br>- [ ] Speed demon (fast completion) |
| `src/app/api/achievements/route.ts`                   | Achievements API        | GET /api/achievements                                          | - [ ] User's earned badges<br>- [ ] Available badges                                                                 |
| `src/app/dashboard/progress/page.tsx`                 | Progress dashboard page | Page component                                                 | - [ ] Stats overview<br>- [ ] Learning streak<br>- [ ] Achievement gallery                                           |
| `src/components/progress/StatsOverview.tsx`           | Learning statistics     | `StatsOverviewProps { stats }`                                 | - [ ] Courses completed<br>- [ ] Hours learned<br>- [ ] Certificates earned                                          |
| `src/components/progress/StreakTracker.tsx`           | Daily streak display    | `StreakTrackerProps { currentStreak, longestStreak }`          | - [ ] Calendar heatmap<br>- [ ] Current streak badge<br>- [ ] Encouragement message                                  |
| `src/components/progress/AchievementGallery.tsx`      | Badge collection        | `AchievementGalleryProps { achievements }`                     | - [ ] Badge grid<br>- [ ] Locked/unlocked states<br>- [ ] Tooltip descriptions                                       |
| `src/components/progress/AchievementNotification.tsx` | Toast notification      | `AchievementNotificationProps { achievement, onClose }`        | - [ ] Celebration animation<br>- [ ] Badge display<br>- [ ] Auto-dismiss                                             |

**Validation Checkpoint:**

- [ ] Achievements award automatically
- [ ] Streaks tracked correctly
- [ ] Progress dashboard loads
- [ ] Badge notifications display
- [ ] Stats calculate accurately

---

## Phase 6: Admin Dashboard (Week 6-7)

### 6.1 Admin Core

**Objective**: Full CRUD for orders, products, and customer management

| File                                       | Description             | Interfaces                                                       | Checklist                                                                |
| ------------------------------------------ | ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/services/admin.ts`                | Admin service layer     | `getDashboardStats()`, `getRecentOrders()`, `getLowStockItems()` | - [ ] Analytics aggregation<br>- [ ] Data authorization                  |
| `src/app/api/admin/stats/route.ts`         | Admin stats API         | GET /api/admin/stats                                             | - [ ] Revenue, orders, customers<br>- [ ] Date range filtering           |
| `src/app/api/admin/orders/route.ts`        | Orders management API   | GET /api/admin/orders                                            | - [ ] All orders<br>- [ ] Status filtering<br>- [ ] Pagination           |
| `src/app/api/admin/orders/[id]/route.ts`   | Order operations        | GET, PUT /api/admin/orders/[id]                                  | - [ ] Order details<br>- [ ] Status updates                              |
| `src/app/api/admin/courses/route.ts`       | Course management API   | GET, POST /api/admin/courses                                     | - [ ] Course CRUD<br>- [ ] Bulk operations                               |
| `src/app/api/admin/courses/[id]/route.ts`  | Course operations       | GET, PUT, DELETE /api/admin/courses/[id]                         | - [ ] Full CRUD<br>- [ ] Image uploads                                   |
| `src/app/api/admin/users/route.ts`         | User management API     | GET /api/admin/users                                             | - [ ] User list<br>- [ ] Role filtering                                  |
| `src/app/api/admin/upload/route.ts`        | File upload API         | POST /api/admin/upload                                           | - [ ] S3/MinIO upload<br>- [ ] Image optimization                        |
| `src/app/admin/page.tsx`                   | Admin dashboard         | Page component (admin layout)                                    | - [ ] Overview cards<br>- [ ] Charts<br>- [ ] Recent activity            |
| `src/app/admin/orders/page.tsx`            | Orders management page  | Page component                                                   | - [ ] Order table<br>- [ ] Status filters<br>- [ ] Export CSV            |
| `src/app/admin/courses/page.tsx`           | Courses management page | Page component                                                   | - [ ] Course table<br>- [ ] Publish toggle<br>- [ ] Quick edit           |
| `src/app/admin/courses/new/page.tsx`       | Create course page      | Page component                                                   | - [ ] Multi-step form<br>- [ ] Image upload<br>- [ ] Curriculum builder  |
| `src/app/admin/courses/[id]/edit/page.tsx` | Edit course page        | Page component                                                   | - [ ] Pre-populated form<br>- [ ] Video management                       |
| `src/app/admin/customers/page.tsx`         | Customer management     | Page component                                                   | - [ ] Customer table<br>- [ ] View orders<br>- [ ] PDPA-compliant notes  |
| `src/components/admin/AdminLayout.tsx`     | Admin shell             | `AdminLayoutProps { children }`                                  | - [ ] Sidebar navigation<br>- [ ] Mobile responsive<br>- [ ] Role check  |
| `src/components/admin/AdminSidebar.tsx`    | Admin navigation        | -                                                                | - [ ] Menu items<br>- [ ] Active state<br>- [ ] Collapsible              |
| `src/components/admin/StatsCard.tsx`       | Statistic display       | `StatsCardProps { title, value, change, icon }`                  | - [ ] Big number<br>- [ ] Trend indicator                                |
| `src/components/admin/RevenueChart.tsx`    | Revenue visualization   | `RevenueChartProps { data }`                                     | - [ ] Recharts implementation<br>- [ ] Date range selector               |
| `src/components/admin/OrderTable.tsx`      | Orders data table       | `OrderTableProps { orders, onStatusChange }`                     | - [ ] TanStack Table<br>- [ ] Sorting, filtering<br>- [ ] Pagination     |
| `src/components/admin/CourseForm.tsx`      | Course creation/editing | `CourseFormProps { course?, onSubmit }`                          | - [ ] react-hook-form<br>- [ ] Dynamic curriculum<br>- [ ] Image preview |
| `src/components/admin/ImageUploader.tsx`   | Image upload component  | `ImageUploaderProps { onUpload, multiple? }`                     | - [ ] Drag & drop<br>- [ ] Preview<br>- [ ] Progress indicator           |

**Validation Checkpoint:**

- [ ] Admin routes protected (ADMIN role only)
- [ ] Dashboard displays stats
- [ ] Orders list with filters
- [ ] Order status updates work
- [ ] Course CRUD complete
- [ ] Image uploads work
- [ ] Customers list accessible
- [ ] PDPA compliance maintained

---

### 6.2 Inventory & Analytics

**Objective**: Stock management and business intelligence

| File                                          | Description          | Interfaces                     | Checklist                                                                 |
| --------------------------------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `src/app/api/admin/inventory/route.ts`        | Inventory API        | GET /api/admin/inventory       | - [ ] Stock levels<br>- [ ] Low stock alerts                              |
| `src/app/admin/inventory/page.tsx`            | Inventory management | Page component                 | - [ ] Stock table<br>- [ ] Adjust stock<br>- [ ] Alert thresholds         |
| `src/components/admin/LowStockAlert.tsx`      | Alert component      | `LowStockAlertProps { items }` | - [ ] Warning banner<br>- [ ] Quick reorder links                         |
| `src/components/admin/AnalyticsDashboard.tsx` | Advanced analytics   | -                              | - [ ] Revenue trends<br>- [ ] Course popularity<br>- [ ] Customer cohorts |

**Validation Checkpoint:**

- [ ] Low stock alerts display
- [ ] Stock adjustments persist
- [ ] Analytics data accurate

---

## Phase 7: Testing & Quality Assurance (Week 7-8)

### 7.1 Unit Testing

**Objective**: 84+ unit tests with Vitest

| File                            | Description             | Interfaces                                 | Checklist                    |
| ------------------------------- | ----------------------- | ------------------------------------------ | ---------------------------- |
| `src/lib/utils.test.ts`         | Utility function tests  | Tests for `cn()`, `formatCurrency()`, etc. | - [ ] 100% coverage on utils |
| `src/lib/validations/*.test.ts` | Validation schema tests | Zod schema tests                           | - [ ] All schemas tested     |
| `src/lib/services/*.test.ts`    | Service layer tests     | Mocked database tests                      | - [ ] Core services tested   |
| `src/lib/auth/*.test.ts`        | Authentication tests    | JWT, password hashing tests                | - [ ] Auth flow tested       |
| `src/components/**/*.test.tsx`  | Component unit tests    | React Testing Library                      | - [ ] 20+ components tested  |
| `src/hooks/*.test.ts`           | Custom hook tests       | React Testing Library                      | - [ ] All hooks tested       |

**Test Requirements:**

- [ ] 84+ total tests
- [ ] > 80% code coverage
- [ ] All tests passing
- [ ] Mock external services (Stripe, Resend)

---

### 7.2 E2E Testing

**Objective**: 4 test suites with Playwright

| File                   | Description           | Interfaces                        | Checklist                                          |
| ---------------------- | --------------------- | --------------------------------- | -------------------------------------------------- |
| `e2e/auth.spec.ts`     | Authentication E2E    | Login, register, logout flows     | - [ ] Full auth journey                            |
| `e2e/cart.spec.ts`     | Shopping cart E2E     | Add, update, remove items         | - [ ] Cart persists<br>- [ ] Checkout works        |
| `e2e/checkout.spec.ts` | Checkout E2E          | Complete purchase flow            | - [ ] Stripe test mode<br>- [ ] Order confirmation |
| `e2e/learning.spec.ts` | Learning platform E2E | Video playback, progress tracking | - [ ] Video plays<br>- [ ] Progress saves          |

**Test Configuration:**

- [ ] `playwright.config.ts` with project settings
- [ ] Test database setup
- [ ] Test fixtures (seed data)
- [ ] CI integration

**Validation Checkpoint:**

- [ ] All 4 test suites pass
- [ ] Screenshots on failure
- [ ] Video recording available

---

### 7.3 Performance & Security

**Objective**: Lighthouse >90, security audit passed

| File                    | Description          | Interfaces                 | Checklist                                     |
| ----------------------- | -------------------- | -------------------------- | --------------------------------------------- |
| `lighthouse.config.js`  | Lighthouse CI config | Performance budgets        | - [ ] CI integration                          |
| `src/lib/security/*.ts` | Security utilities   | CSP, headers, sanitization | - [ ] XSS prevention<br>- [ ] CSRF protection |

**Security Checklist:**

- [ ] Content Security Policy (CSP) configured
- [ ] Secure HTTP headers (HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting on API routes
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (SameSite cookies)
- [ ] Secure password storage (bcrypt)
- [ ] JWT security (HttpOnly, Secure, SameSite)
- [ ] PDPA compliance (consent tracking, data access logs)

**Performance Checklist:**

- [ ] Lighthouse Performance >90
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s
- [ ] Cumulative Layout Shift <0.1
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Fonts optimized (subsetting, display=swap)

**Validation Checkpoint:**

- [ ] Lighthouse audit passes
- [ ] Security headers verified
- [ ] No vulnerabilities in `npm audit`
- [ ] Sentry error tracking configured

---

## Phase 8: Deployment & DevOps (Week 8+)

### 8.1 CI/CD Pipeline

**Objective**: GitHub Actions workflows for testing and deployment

| File                                      | Description            | Interfaces                       | Checklist                                                                     |
| ----------------------------------------- | ---------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                | Continuous Integration | Type check, lint, unit tests     | - [ ] Triggers on PR<br>- [ ] Parallel jobs                                   |
| `.github/workflows/e2e.yml`               | E2E tests              | Playwright with PostgreSQL       | - [ ] Test database service<br>- [ ] Artifact upload                          |
| `.github/workflows/deploy-staging.yml`    | Staging deployment     | Auto-deploy to staging           | - [ ] Docker build<br>- [ ] Vercel/AWS deploy                                 |
| `.github/workflows/deploy-production.yml` | Production deployment  | Production release with rollback | - [ ] Manual approval<br>- [ ] Blue-green deploy<br>- [ ] Rollback capability |
| `.github/workflows/backup.yml`            | Database backup        | Daily backups to S3              | - [ ] Automated schedule<br>- [ ] S3 upload<br>- [ ] Retention policy         |

**Validation Checkpoint:**

- [ ] CI passes on PR
- [ ] E2E tests pass
- [ ] Staging auto-deploys
- [ ] Production manual deploy works
- [ ] Backups run daily

---

### 8.2 Production Infrastructure

**Objective**: Production-ready deployment with monitoring

| File                       | Description             | Interfaces                   | Checklist                                                                  |
| -------------------------- | ----------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `Dockerfile`               | Production container    | Multi-stage build            | - [ ] Node 20+ base<br>- [ ] Non-root user<br>- [ ] Optimized layers       |
| `docker-compose.prod.yml`  | Production stack        | Next.js + Nginx + PostgreSQL | - [ ] Nginx reverse proxy<br>- [ ] SSL certificates<br>- [ ] Health checks |
| `sentry.client.config.ts`  | Sentry client config    | Error tracking               | - [ ] DSN configured<br>- [ ] Sample rate set                              |
| `sentry.server.config.ts`  | Sentry server config    | Error tracking               | - [ ] Server-side errors<br>- [ ] Performance monitoring                   |
| `src/app/global-error.tsx` | Global error boundary   | Error UI                     | - [ ] Fallback UI<br>- [ ] Error reporting                                 |
| `src/instrumentation.ts`   | Next.js instrumentation | Monitoring hooks             | - [ ] Sentry integration                                                   |

**Production Checklist:**

- [ ] Environment variables set in production
- [ ] Database migrations run automatically
- [ ] SSL certificates configured
- [ ] CDN configured for static assets
- [ ] Sentry error tracking active
- [ ] Analytics (GA4) configured
- [ ] Email service (Resend) production keys
- [ ] Stripe production keys

---

## Summary: File Inventory

### Total Files to Create: **120+ files**

| Category          | Count | Key Files                                                                            |
| ----------------- | ----- | ------------------------------------------------------------------------------------ |
| **Configuration** | 10    | `next.config.ts`, `tailwind.config.ts`, `prisma/schema.prisma`, `docker-compose.yml` |
| **API Routes**    | 25    | Auth, courses, cart, checkout, orders, admin endpoints                               |
| **Pages**         | 20    | Homepage, courses, checkout, dashboard, admin pages                                  |
| **Components**    | 50    | UI primitives, feature components, layout components                                 |
| **Services**      | 15    | Business logic, database operations                                                  |
| **Hooks**         | 5     | Custom React hooks                                                                   |
| **Tests**         | 20    | Unit tests (Vitest) + E2E tests (Playwright)                                         |
| **CI/CD**         | 5     | GitHub Actions workflows                                                             |

---

## Execution Priorities

### Week 1-2: Foundation

1. Set up project structure
2. Configure database (Prisma + PostgreSQL)
3. Implement authentication system
4. Create base UI components

### Week 3-4: Storefront

1. Build course catalog
2. Implement homepage with bento grid
3. Create shopping cart system
4. Design course detail pages

### Week 5: Checkout

1. Integrate Stripe payments
2. Implement Singapore GST (9%)
3. Build checkout flow
4. Set up email confirmations

### Week 6: Learning Platform

1. Build video player with progress tracking
2. Create student dashboard
3. Implement gamification (badges, streaks)
4. Add note-taking feature

### Week 7: Admin & Testing

1. Build admin dashboard
2. Implement order management
3. Create course management tools
4. Write comprehensive tests (84+)

### Week 8: Polish & Deploy

1. Performance optimization
2. Security audit
3. Accessibility compliance (WCAG AAA)
4. CI/CD pipeline
5. Production deployment

---

## Success Criteria

Before considering the project complete, verify:

### Functionality

- [ ] User can browse courses, add to cart, checkout
- [ ] Stripe payments process successfully with GST
- [ ] Course videos play and track progress
- [ ] Admin can manage orders and courses
- [ ] Email confirmations send automatically

### Design

- [ ] Homepage matches "Artisanal Editorial" aesthetic
- [ ] Bento grid layout implemented
- [ ] Spring animations smooth (60fps)
- [ ] Color palette applied consistently
- [ ] Typography hierarchy clear

### Quality

- [ ] 84+ unit tests passing
- [ ] 4 E2E test suites passing
- [ ] Lighthouse Performance >90
- [ ] WCAG AAA accessibility compliance
- [ ] Security audit passed (no high/critical vulnerabilities)

### Operations

- [ ] CI/CD pipeline operational
- [ ] Production monitoring active (Sentry)
- [ ] Automated backups running
- [ ] Error tracking configured

---

## Risk Mitigation

| Risk                              | Mitigation                                               |
| --------------------------------- | -------------------------------------------------------- |
| **Stripe integration complexity** | Start with Stripe test mode, implement webhooks early    |
| **Video hosting costs**           | Use S3/MinIO initially, optimize with CDN later          |
| **Database performance**          | Add indexing, implement caching strategy                 |
| **PDPA compliance**               | Build consent tracking from day one, log all data access |
| **Scope creep**                   | Strict adherence to phased approach, MVP mindset         |
| **Design implementation**         | Weekly design reviews, pixel-perfect enforcement         |

---

## Next Steps

1. **Review this plan** - Validate scope and timeline
2. **Set up development environment** - Docker, Node.js, VS Code
3. **Initialize project** - Run `npx create-next-app@latest` with Tailwind v4
4. **Begin Phase 1** - Database schema and authentication
5. **Weekly check-ins** - Progress review against this plan

---

**Plan Created**: 2026-02-04  
**Version**: 1.0  
**Author**: Master Architect  
**Status**: Ready for implementation
