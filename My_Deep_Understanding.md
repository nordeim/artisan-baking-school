# L'Artisan Baking Atelier - Deep Understanding Document

> **Document Purpose**: Comprehensive reference for project alignment, architecture understanding, and implementation tracking
> **Last Updated**: 2026-02-05
> **Author**: Elite Frontend Architect & Avant-Garde UI Designer

---

## Project Overview

**L'Artisan Baking Atelier** is a full-stack e-commerce platform for a Singapore-based artisan baking school, merging the "Édition Boulangerie" design philosophy with complete e-commerce functionality.

### Strategic Architecture

| Layer        | Technology                                                           |
| ------------ | -------------------------------------------------------------------- |
| **Frontend** | Next.js 16.1.6, React 19.2.3, Tailwind CSS v4, Framer Motion 12.31.0 |
| **Backend**  | Next.js API Routes, Prisma ORM 6.19.2                                |
| **Database** | PostgreSQL 16 (Docker), Redis 7 (Docker)                             |
| **Payments** | Stripe integration with Singapore GST (9%) compliance                |
| **Auth**     | JWT-based (jose library), bcryptjs for passwords                     |
| **Testing**  | Vitest 4.0.18, React Testing Library, Playwright                     |

### Project Root

```
/home/project/deep-design/
├── lartisan-baking-atelier/      # Main Next.js application
├── docker-compose.yml            # PostgreSQL + Redis services
└── My_Deep_Understanding.md     # This document
```

---

## Current Status Summary

### Test Results: 111/111 Passing (100%)

| Module             | Tests | Status      |
| ------------------ | ----- | ----------- |
| JWT Authentication | 21/21 | ✅ Complete |
| Core Utilities     | 55/55 | ✅ Complete |
| Validation Schemas | 21/21 | ✅ Complete |
| Password Utilities | 14/14 | ✅ Complete |

---

## Phase 1: Foundation & Infrastructure - 95% Complete

### ✅ Completed Components

#### 1. Project Configuration

- **Next.js 16.1.6** with App Router and Turbopack
- **TypeScript 5** with strict mode enabled
- **Tailwind CSS v4** with CSS-first architecture
- All core dependencies installed (42 packages)

#### 2. Database Schema (`prisma/schema.prisma`)

15 production-ready models with:

- User authentication with PDPA compliance fields
- Course catalog with GST tracking
- E-commerce (Orders, Cart, Payments)
- Learning platform (Videos, Progress, Reviews)
- Gamification (Achievements, UserAchievements)
- Comprehensive indexes for performance

#### 3. Design System (`src/app/globals.css`)

**Édition Boulangerie** color palette:

```css
--color-bone: hsl(42, 15%, 94%); /* Flour/Bone */
--color-sourdough: hsl(32, 40%, 72%); /* Golden Crust */
--color-burnt: hsl(18, 65%, 28%); /* Caramelization */
--color-copper: hsl(21, 50%, 52%); /* Cookware */
```

Typography: Playfair Display (serif) + Inter (sans-serif)
Spring physics animations with stiffness: 180, damping: 22

#### 4. Core Utilities (`src/lib/utils.ts`)

18 utility functions including:

- `cn()` - Tailwind class merging
- `formatCurrency()` - SGD formatting
- `calculateGST()` - 9% Singapore GST
- `generateOrderNumber()` - Unique order IDs
- `formatDate()` - Multiple date formats
- `slugify()` - URL-safe strings

#### 5. Validation Schemas (`src/lib/validations/auth.ts`)

Zod schemas with type inference:

- `loginSchema` - Email + password validation
- `registerSchema` - Registration with PDPA consent
- `forgotPasswordSchema` - Password reset request
- `resetPasswordSchema` - Password reset execution
- `changePasswordSchema` - Logged-in password change

#### 6. Authentication Layer

- **JWT Utilities** (`src/lib/auth/jwt.ts`)
  - Access tokens (7-day expiry)
  - Refresh tokens (30-day expiry)
  - HS256 algorithm with jose library
  - Token decoding and expiration checking

- **Password Utilities** (`src/lib/auth/password.ts`)
  - bcryptjs with 12 salt rounds
  - `hashPassword()` and `verifyPassword()`
  - `generateSecureToken()` for reset tokens

---

## Phase 2: Authentication & User Management - 30% Complete

### ✅ Completed

| Component          | File                          | Status       |
| ------------------ | ----------------------------- | ------------ |
| Database Schema    | `prisma/schema.prisma`        | ✅ 15 models |
| Password Utilities | `src/lib/auth/password.ts`    | ✅ 14 tests  |
| JWT Implementation | `src/lib/auth/jwt.ts`         | ✅ 21 tests  |
| Validation Schemas | `src/lib/validations/auth.ts` | ✅ 21 tests  |

### 🔄 Remaining Tasks (Priority Order)

#### 1. Session Management ⏳ HIGH PRIORITY

- **File**: `src/lib/auth/session.ts`
- **Test**: `src/lib/auth/session.test.ts`
- **Functions**:
  - `createSession(userId, role)` - Cookie-based session
  - `getSession()` - Retrieve current session
  - `refreshSession(refreshToken)` - Token refresh
  - `destroySession()` - Clear cookies
- **Cookie Config**: HttpOnly, Secure (production), SameSite=strict

#### 2. Authentication API Routes ⏳ HIGH PRIORITY

**Registration Endpoint** (`src/app/api/auth/register/route.ts`)

- Zod validation with `registerSchema`
- Email uniqueness check
- Password hashing
- User creation
- JWT token issuance
- HTTP-only cookie setting
- Return sanitized user data (201)

**Login Endpoint** (`src/app/api/auth/login/route.ts`)

- Credential validation
- Password verification
- JWT token issuance
- Cookie setting
- Return user data (200)

**Logout Endpoint** (`src/app/api/auth/logout/route.ts`)

- Clear HTTP-only cookies
- Session invalidation

**Current User Endpoint** (`src/app/api/auth/me/route.ts`)

- JWT validation from cookies
- Return sanitized user data
- Handle expired tokens

#### 3. Next.js Middleware ⏳ HIGH PRIORITY

- **File**: `src/middleware.ts`
- **Test**: `src/middleware.test.ts`
- **Features**:
  - JWT validation from cookies
  - Public routes whitelist: `/`, `/courses`, `/login`, `/register`
  - Protected routes: `/dashboard/*`, `/checkout/*`, `/learn/*`
  - Admin routes: `/admin/*`, `/api/admin/*`
  - Redirect unauthorized to `/login`
  - Role-based access control

#### 4. Authentication Components ⏳ MEDIUM PRIORITY

**LoginForm** (`src/components/auth/LoginForm.tsx`)

- react-hook-form integration
- Zod client-side validation
- Loading state during submission
- Error display
- "Remember me" checkbox
- Links to registration and forgot password

**RegisterForm** (`src/components/auth/RegisterForm.tsx`)

- Name, email, password, confirm password inputs
- Password strength indicator (weak/medium/strong)
- PDPA consent checkbox (required)
- Marketing consent checkbox (optional)
- Terms of service link
- Link to login page

**Auth Provider Hook** (`src/hooks/useAuth.ts`)

- `user` - Current user state
- `isLoading` - Loading state
- `login(email, password)` - Login function
- `register(data)` - Registration function
- `logout()` - Logout function
- Auto-fetch user on mount

**ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)

- Authentication status check
- Loading state display
- Redirect to login if unauthorized
- Optional role-based access
- Preserve redirect URL

#### 5. Authentication Pages ⏳ MEDIUM PRIORITY

**Login Page** (`src/app/login/page.tsx`)

- Centered layout with Édition Boulangerie styling
- LoginForm component
- Link to registration
- Link to forgot password
- SEO metadata

**Register Page** (`src/app/register/page.tsx`)

- Centered layout
- RegisterForm component
- Link to login
- PDPA notice with legal text
- SEO metadata

---

## Phase 2 Implementation Plan (TDD)

### Task Execution Order

1. **Session Management** (2.3.2)
   - Write failing tests first
   - Implement cookie-based sessions
   - Verify all tests pass

2. **Registration API** (2.4.1)
   - Write API tests
   - Implement POST /api/auth/register
   - Test email uniqueness, password validation, PDPA consent

3. **Login API** (2.4.2)
   - Write API tests
   - Implement POST /api/auth/login
   - Test credential validation, token issuance

4. **Logout & Me APIs** (2.4.3)
   - Write tests
   - Implement logout and current user endpoints

5. **Middleware** (2.5.1)
   - Write middleware tests
   - Implement route protection
   - Test public/protected/admin route behavior

6. **UI Components** (2.6.x)
   - Button component (shadcn/ui style)
   - Input component
   - LoginForm
   - RegisterForm
   - AuthProvider hook
   - ProtectedRoute wrapper

7. **Auth Pages** (2.7.x)
   - /login page
   - /register page

---

## Docker Services Status

| Service    | Image              | Port | Status               |
| ---------- | ------------------ | ---- | -------------------- |
| PostgreSQL | postgres:16-alpine | 5432 | ✅ Running (9 hours) |
| Redis      | redis:7-alpine     | 6379 | ✅ Running (9 hours) |

---

## Environment Configuration

Required in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/lartisan_dev"

# Authentication
JWT_SECRET="min-32-characters-secret-key"
JWT_REFRESH_SECRET="min-32-characters-refresh-secret"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (Resend)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@lartisan.sg"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Design Principles

### Anti-Generic Philosophy

- Reject Bootstrap-style grids and purple-gradient clichés
- Bespoke layouts with intentional asymmetry
- Every element earns its place through calculated purpose

### Typography Hierarchy

- Headlines: Playfair Display (serif) - editorial elegance
- Body: Inter - modern readability
- Spring animations: 180 stiffness, 22 damping

### Color System (60-30-10 Rule)

- 60% Bone (neutral backgrounds)
- 30% Sourdough (warm accents)
- 10% Burnt/Copper (CTAs and highlights)

---

## Key Constraints & Considerations

### Security

- JWT tokens with separate access/refresh secrets
- bcrypt with 12 salt rounds
- HttpOnly, Secure, SameSite=strict cookies
- PDPA compliance (Singapore data protection)

### Performance

- Turbopack for fast dev builds
- Database indexes on frequently queried fields
- Singleton Prisma client for connection pooling

### Accessibility (WCAG AAA)

- Focus-visible states
- Reduced motion support
- Semantic HTML
- Proper heading hierarchy

### Singapore Compliance

- 9% GST calculation on all orders
- PDPA consent tracking
- Singapore Dollar (SGD) formatting
- Local date formatting (en-SG)

---

## Success Criteria

### Phase 1 Success (Achieved)

- ✅ 111+ unit tests passing
- ✅ Database schema with 15 models
- ✅ JWT authentication layer
- ✅ Core utilities with tests
- ✅ Design system implemented
- ✅ Docker services running

### Phase 2 Success (In Progress)

- ⏳ Session management with cookies
- ⏳ Registration API working
- ⏳ Login API working
- ⏳ Logout API working
- ⏳ Current user API working
- ⏳ Middleware protecting routes
- ⏳ Login form UI
- ⏳ Register form UI
- ⏳ Auth pages (/login, /register)
- ⏳ 150+ total tests passing

---

## Next Steps After Phase 2

1. **Phase 3**: Product Catalog & Storefront
   - Course browsing and filtering
   - Course detail pages
   - Homepage with Bento grid

2. **Phase 4**: Shopping Cart & Checkout
   - Cart persistence (localStorage + DB)
   - Stripe integration
   - GST calculation display

3. **Phase 5**: Learning Platform
   - Video player with progress tracking
   - Course completion detection
   - Achievement system

4. **Phase 6**: Admin Dashboard
   - Order management
   - Course CRUD
   - Customer management

5. **Phase 7**: Testing & QA
   - E2E tests with Playwright
   - Performance optimization
   - Security audit

---

## Reference Documents

- **Master Execution Plan**: `MASTER_EXECUTION_PLAN.md`
- **Phase 1 Subplan**: `PHASE_1_SUBPLAN.md`
- **Phase 2 Subplan**: `PHASE_2_SUBPLAN.md`
- **Current Status**: `status.md`

---

## Developer Notes

### Running Tests

```bash
npm test              # Run all Vitest tests
npm run test:watch    # Watch mode
npm run type-check    # TypeScript validation
npm run lint          # ESLint checks
npm run ci            # Full CI pipeline
```

### Database Commands

```bash
npm run db:migrate    # Apply migrations
npm run db:seed       # Populate seed data
npm run db:studio     # Open Prisma Studio
npm run docker:up     # Start Docker services
```

### TDD Workflow

1. **RED**: Write failing test first
2. **GREEN**: Implement to make test pass
3. **REFACTOR**: Clean up while tests pass
4. **REPEAT**: Move to next component

---

**Document maintained by**: Elite Frontend Architect & Avant-Garde UI Designer
**Philosophy**: Anti-generic, intentional minimalism, production-grade craftsmanship
