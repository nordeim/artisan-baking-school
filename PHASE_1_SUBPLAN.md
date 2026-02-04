# Phase 1: Foundation & Infrastructure - Detailed Execution Plan

## TDD Methodology

**Red → Green → Refactor**
Every file will be developed with tests first.

---

## Phase 1.1: Project Initialization (Estimated: 2-3 hours)

### Step 1.1.1: Initialize Next.js Project

**RED (Test)**: No project exists
**GREEN (Implementation)**: Initialize with TypeScript, Tailwind v4, App Router

**Commands to Execute:**

```bash
# Verify Node.js version >= 20
node --version

# Initialize Next.js 16 with Tailwind v4
npx create-next-app@latest lartisan-baking-atelier \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

# Navigate to project
cd lartisan-baking-atelier
```

**Files to Modify:**

- `package.json` - Verify Next.js 16.1.4+, Tailwind v4.1.18+

**Validation Tests:**

- [ ] `npm run dev` starts successfully
- [ ] TypeScript compiles without errors
- [ ] Tailwind v4 CSS-first syntax works

---

### Step 1.1.2: Install Core Dependencies

**RED (Test)**: Dependencies not installed
**GREEN (Implementation)**: Install all required packages

**Commands:**

```bash
# Core dependencies
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install framer-motion
npm install lucide-react
npm install zod

# Authentication & Security
npm install bcryptjs jose
npm install @heroicons/react

# Database
npm install @prisma/client prisma
npm install pg @prisma/adapter-pg

# Forms
npm install react-hook-form @hookform/resolvers

# Email & Payments
npm install resend stripe @stripe/react-stripe-js @stripe/stripe-js

# State Management
npm install zustand

# Tables & Charts
npm install @tanstack/react-table recharts

# Monitoring
npm install @sentry/nextjs

# Testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
npm install --save-dev @playwright/test
npm install --save-dev @types/bcryptjs
```

**Files Created/Modified:**

- `package.json` - Updated with all dependencies

**Validation Tests:**

- [ ] `npm install` completes without errors
- [ ] All packages resolve correctly
- [ ] No peer dependency warnings

---

### Step 1.1.3: Configure Tailwind CSS v4 (CSS-First)

**RED (Test)**: Tailwind v4 not configured with design tokens
**GREEN (Implementation)**: Implement CSS-first configuration

**Files to Create:**

1. `src/app/globals.css` - CSS-first Tailwind v4 with design system
2. `postcss.config.mjs` - PostCSS configuration

**Design Tokens to Implement:**

```css
/* HSB-Derived Color System */
--color-bone: hsl(42, 15%, 94%);
--color-bone-dark: hsl(42, 18%, 86%);
--color-sourdough: hsl(32, 40%, 72%);
--color-sourdough-dark: hsl(32, 45%, 60%);
--color-burnt: hsl(18, 65%, 28%);
--color-burnt-light: hsl(18, 40%, 40%);
--color-copper: hsl(21, 50%, 52%);

/* Typography */
--font-sans: "Inter", system-ui, sans-serif;
--font-serif: "Playfair Display", "Times New Roman", serif;

/* Spring Animation Constants */
--spring-stiffness: 180;
--spring-damping: 22;
--spring-mass: 1;
```

**Validation Tests:**

- [ ] Tailwind classes compile correctly
- [ ] Custom colors accessible via `bg-bone`, `text-burnt`
- [ ] Fonts load from Google Fonts
- [ ] Animation constants defined

---

## Phase 1.2: Development Environment Setup (Estimated: 2 hours)

### Step 1.2.1: Environment Configuration

**RED (Test)**: No environment configuration exists
**GREEN (Implementation)**: Create comprehensive env configuration

**Files to Create:**

1. `.env.local` - Local development environment
2. `.env.example` - Template for team
3. `.env.test` - Test environment

**Environment Variables Required:**

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/lartisan_dev"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-characters"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@lartisan.sg"

# Monitoring
SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="sntrys_..."

# AWS S3 (for backups/uploads)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="lartisan-production"
AWS_REGION="ap-southeast-1"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

**Validation Tests:**

- [ ] All env vars documented in `.env.example`
- [ ] Sensitive keys not committed to git
- [ ] `.env.local` in `.gitignore`

---

### Step 1.2.2: Docker Configuration

**RED (Test)**: No Docker setup exists
**GREEN (Implementation)**: Create Docker Compose for local development

**Files to Create:**

1. `docker-compose.yml` - Local development stack
2. `Dockerfile` - Production container (basic version)

**Services Required:**

- PostgreSQL 16 (database)
- Redis (optional caching)
- MinIO (S3-compatible local storage for file uploads)

**Validation Tests:**

- [ ] `docker-compose up -d` starts all services
- [ ] PostgreSQL accessible on port 5432
- [ ] MinIO accessible on ports 9000/9001
- [ ] Volumes persist data

---

### Step 1.2.3: TypeScript Configuration

**RED (Test)**: TypeScript not strict
**GREEN (Implementation)**: Configure strict TypeScript

**Files to Modify:**

1. `tsconfig.json` - Strict mode configuration

**Required Settings:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Validation Tests:**

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No `any` types allowed in code

---

### Step 1.2.4: Next.js Configuration

**RED (Test)**: Next.js not configured for production
**GREEN (Implementation)**: Configure Next.js with security headers

**Files to Create:**

1. `next.config.ts` - Next.js configuration

**Required Configuration:**

- Security headers (CSP, X-Frame-Options, etc.)
- Image domains whitelist
- Turbopack enabled
- Rewrites/redirects if needed

**Validation Tests:**

- [ ] `npm run build` completes successfully
- [ ] Security headers present in responses
- [ ] Turbopack working in dev mode

---

## Phase 1.3: Database Schema & Prisma Setup (Estimated: 3-4 hours)

### Step 1.3.1: Initialize Prisma

**RED (Test)**: No database schema exists
**GREEN (Implementation)**: Initialize Prisma with PostgreSQL

**Commands:**

```bash
npx prisma init
```

**Files Created:**

- `prisma/schema.prisma`
- `.env` (Prisma updates this)

**Validation Tests:**

- [ ] Prisma initialized successfully
- [ ] Database URL configured

---

### Step 1.3.2: Design Database Schema

**RED (Test)**: Schema doesn't match requirements
**GREEN (Implementation)**: Create comprehensive schema

**Models to Implement:**

1. **User** - Authentication, roles, profile
2. **Course** - Course content, pricing, metadata
3. **Category** - Course categorization
4. **Order** - Purchase transactions with GST
5. **OrderItem** - Line items
6. **Cart** - Shopping cart (guest + authenticated)
7. **CartItem** - Cart line items
8. **Video** - Course video content
9. **Progress** - Student learning progress
10. **Review** - Course reviews/ratings

**Schema Requirements:**

- All relations properly mapped
- Indexes for performance
- PDPA compliance fields
- GST tracking (9%)
- Soft deletes where appropriate

**Validation Tests:**

- [ ] Schema validates with `prisma validate`
- [ ] All relations are correct
- [ ] No circular dependencies

---

### Step 1.3.3: Create Migrations

**RED (Test)**: No database migrations exist
**GREEN (Implementation)**: Generate and apply migrations

**Commands:**

```bash
npx prisma migrate dev --name init
```

**Files Created:**

- `prisma/migrations/000000000000_init/migration.sql`

**Validation Tests:**

- [ ] Migration applies without errors
- [ ] Database tables created correctly
- [ ] Foreign keys properly set

---

### Step 1.3.4: Create Seed Data

**RED (Test)**: Database is empty
**GREEN (Implementation)**: Seed with realistic test data

**Files to Create:**

1. `prisma/seed.ts` - Database seeding script

**Seed Data Requirements:**

- 4 courses (Sourdough Mastery, Viennoiserie Artistry, Pâtisserie Fundamentals, Artisan Breads)
- 2 categories (Bread, Pastry)
- 1 admin user
- 1 sample order
- Sample reviews

**Commands:**

```bash
npx prisma db seed
```

**Validation Tests:**

- [ ] Seed script runs successfully
- [ ] Data visible in Prisma Studio
- [ ] All relations populated

---

### Step 1.3.5: Prisma Client Setup

**RED (Test)**: Prisma client not configured
**GREEN (Implementation)**: Create singleton Prisma client

**Files to Create:**

1. `src/lib/prisma.ts` - Prisma client singleton

**Requirements:**

- Singleton pattern for connection pooling
- Error handling
- Connection limits configured

**Validation Tests:**

- [ ] Client connects to database
- [ ] Queries execute successfully
- [ ] Connection pooling works

---

## Phase 1.4: Core Utilities & Validation (Estimated: 2-3 hours)

### Step 1.4.1: Utility Functions

**RED (Test)**: Write failing tests first
**GREEN (Implementation)**: Implement utils

**Files to Create:**

1. `src/lib/utils.ts` - Core utilities
2. `src/lib/utils.test.ts` - Unit tests

**Functions to Implement:**

- `cn()` - Class name merging (tailwind-merge + clsx)
- `formatCurrency()` - SGD currency formatting
- `formatDate()` - Date formatting with date-fns
- `calculateGST()` - Singapore GST calculation (9%)
- `generateOrderNumber()` - Unique order number generation

**TDD Tests:**

```typescript
// Test: cn() merges classes correctly
describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

// Test: GST calculation
describe("calculateGST", () => {
  it("calculates 9% GST correctly", () => {
    expect(calculateGST(100)).toBe(9);
    expect(calculateGST(55.5)).toBe(5);
  });
});
```

**Validation Tests:**

- [ ] All utils have passing tests
- [ ] 100% code coverage on utils

---

### Step 1.4.2: Zod Validation Schemas

**RED (Test)**: Write schema tests first
**GREEN (Implementation)**: Implement validation schemas

**Files to Create:**

1. `src/lib/validations/auth.ts` - Auth schemas
2. `src/lib/validations/auth.test.ts` - Tests
3. `src/lib/validations/course.ts` - Course schemas
4. `src/lib/validations/cart.ts` - Cart schemas
5. `src/lib/validations/checkout.ts` - Checkout schemas

**Schemas Required:**

- `loginSchema` - Email + password validation
- `registerSchema` - Registration validation with PDPA consent
- `courseSchema` - Course creation/editing
- `cartItemSchema` - Cart item validation
- `checkoutSchema` - Checkout form validation

**Validation Tests:**

- [ ] All schemas validate correctly
- [ ] Error messages are user-friendly
- [ ] Type inference works

---

## Phase 1.5: Authentication Foundation (Estimated: 4-5 hours)

### Step 1.5.1: Password Utilities

**RED (Test)**: No password hashing
**GREEN (Implementation)**: Implement bcrypt password handling

**Files to Create:**

1. `src/lib/auth/password.ts` - Password utilities
2. `src/lib/auth/password.test.ts` - Tests

**Functions:**

- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`

**TDD Tests:**

```typescript
describe("password", () => {
  it("hashes password correctly", async () => {
    const hash = await hashPassword("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

---

### Step 1.5.2: JWT Utilities

**RED (Test)**: No JWT implementation
**GREEN (Implementation)**: Implement JWT with Jose

**Files to Create:**

1. `src/lib/auth/jwt.ts` - JWT utilities
2. `src/lib/auth/jwt.test.ts` - Tests

**Functions:**

- `signJWT(payload, secret, expiresIn)`
- `verifyJWT(token, secret)`
- `signRefreshToken(payload)`
- `verifyRefreshToken(token)`

**Requirements:**

- Access token: 7 days expiry
- Refresh token: 30 days expiry
- HS256 algorithm

**Validation Tests:**

- [ ] Tokens sign and verify correctly
- [ ] Expired tokens rejected
- [ ] Invalid signatures rejected

---

### Step 1.5.3: Session Management

**RED (Test)**: No session handling
**GREEN (Implementation)**: Implement cookie-based sessions

**Files to Create:**

1. `src/lib/auth/session.ts` - Session management
2. `src/lib/auth/session.test.ts` - Tests

**Functions:**

- `createSession(userId)` - Create session with cookies
- `getSession()` - Get current session from cookies
- `destroySession()` - Clear session

**Requirements:**

- HttpOnly cookies
- Secure flag in production
- SameSite=Strict

---

### Step 1.5.4: PDPA Compliance Utilities

**RED (Test)**: No PDPA handling
**GREEN (Implementation)**: Implement PDPA compliance

**Files to Create:**

1. `src/lib/auth/pdpa.ts` - PDPA utilities

**Requirements:**

- Consent tracking
- Data access logging
- Right to deletion (anonymization)

---

### Step 1.5.5: Auth API Routes

**RED (Test)**: No auth endpoints
**GREEN (Implementation)**: Implement auth API routes

**Files to Create:**

1. `src/app/api/auth/register/route.ts` - Registration
2. `src/app/api/auth/register/route.test.ts` - Tests
3. `src/app/api/auth/login/route.ts` - Login
4. `src/app/api/auth/login/route.test.ts` - Tests
5. `src/app/api/auth/logout/route.ts` - Logout
6. `src/app/api/auth/me/route.ts` - Current user

**Validation Tests:**

- [ ] Registration creates user with hashed password
- [ ] Login issues valid JWT
- [ ] Logout clears cookies
- [ ] `/me` returns current user

---

### Step 1.5.6: Protected Route Middleware

**RED (Test)**: No route protection
**GREEN (Implementation)**: Implement Next.js middleware

**Files to Create:**

1. `src/middleware.ts` - Route protection

**Requirements:**

- JWT validation
- Public routes whitelist
- Redirect to login for unauthorized
- Role-based access (ADMIN vs STUDENT)

---

## Phase 1.6: Base UI Components (Estimated: 3-4 hours)

### Step 1.6.1: Button Component

**RED (Test)**: No button component
**GREEN (Implementation)**: Create shadcn-style Button

**Files to Create:**

1. `src/components/ui/Button.tsx`
2. `src/components/ui/Button.test.tsx`

**Features:**

- Variants: default, outline, ghost, link
- Sizes: default, sm, lg, icon
- Loading state
- Disabled state

---

### Step 1.6.2: Input Component

**RED (Test)**: No input component
**GREEN (Implementation)**: Create Input component

**Files to Create:**

1. `src/components/ui/Input.tsx`
2. `src/components/ui/Input.test.tsx`

**Features:**

- Label support
- Error message display
- Required indicator
- Focus states

---

### Step 1.6.3: Card Component

**RED (Test)**: No card component
**GREEN (Implementation)**: Create Card component

**Files to Create:**

1. `src/components/ui/Card.tsx`

**Features:**

- Header, content, footer sections
- Spring animation support
- Hover effects

---

## Phase 1.7: Test Infrastructure (Estimated: 1 hour)

### Step 1.7.1: Vitest Configuration

**Files to Create:**

1. `vitest.config.ts` - Vitest configuration
2. `src/test/setup.ts` - Test setup

**Requirements:**

- jsdom environment
- @testing-library integration
- Path aliases configured

---

### Step 1.7.2: Test Utilities

**Files to Create:**

1. `src/test/factories.ts` - Test data factories
2. `src/test/mocks.ts` - Mock implementations

---

## Phase 1 Validation Checklist

### Pre-Phase Check

- [ ] Node.js >= 20 installed
- [ ] Docker installed and running
- [ ] Git initialized

### During Phase

- [ ] Every file has tests (TDD compliance)
- [ ] Tests pass before moving to next file
- [ ] No `any` types in code
- [ ] All env vars documented

### Post-Phase Validation

- [ ] `npm run dev` starts without errors
- [ ] `npm run type-check` passes (zero errors)
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test` passes (all unit tests)
- [ ] `npm run build` completes successfully
- [ ] Docker services running
- [ ] Database migrations applied
- [ ] Seed data populated
- [ ] Auth endpoints responding

### Quality Gates

- [ ] Test coverage >80% for utilities
- [ ] No console errors in dev mode
- [ ] All TypeScript strict checks pass
- [ ] Security headers configured
- [ ] PDPA utilities implemented

---

## Estimated Timeline

| Step                       | Estimated Time | Cumulative  |
| -------------------------- | -------------- | ----------- |
| 1.1 Project Initialization | 2-3 hours      | 2-3 hours   |
| 1.2 Environment Setup      | 2 hours        | 4-5 hours   |
| 1.3 Database Schema        | 3-4 hours      | 7-9 hours   |
| 1.4 Core Utilities         | 2-3 hours      | 9-12 hours  |
| 1.5 Authentication         | 4-5 hours      | 13-17 hours |
| 1.6 Base UI Components     | 3-4 hours      | 16-21 hours |
| 1.7 Test Infrastructure    | 1 hour         | 17-22 hours |

**Total Estimated Time: 17-22 hours**

---

## Next Steps After Phase 1

1. Run full test suite
2. Validate build output
3. Review code quality
4. Proceed to Phase 2: Authentication & User Management

**Phase 1 Success Criteria:**

- [ ] All 120+ unit tests passing
- [ ] Database fully configured with seed data
- [ ] Authentication system functional
- [ ] Base UI components created
- [ ] Build succeeds without errors
