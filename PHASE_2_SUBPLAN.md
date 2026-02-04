# Phase 2: Authentication & User Management - Detailed Execution Plan

## TDD Methodology

**Red → Green → Refactor**
Every component will be developed with tests first.

---

## Phase 2.1: Database Schema Design (Estimated: 3-4 hours)

### Step 2.1.1: Initialize Prisma

**RED (Test)**: No database schema exists
**GREEN (Implementation)**: Initialize Prisma ORM

**Commands:**

```bash
npx prisma init
```

**Files Created:**

- `prisma/schema.prisma` - Database schema definition
- `.env` - Database URL (Prisma will update this)

**Models Required:**

1. **User** - Authentication & profile data
2. **Account** - OAuth accounts (if implementing)
3. **Session** - Session management
4. **Course** - Course content & metadata
5. **Category** - Course categorization
6. **Order** - Purchase transactions
7. **OrderItem** - Line items in orders
8. **Cart** - Shopping cart
9. **CartItem** - Items in cart
10. **Video** - Course video content
11. **Progress** - Student learning progress
12. **Review** - Course reviews
13. **Payment** - Payment records
14. **Achievement** - Gamification badges
15. **UserAchievement** - User-earned achievements

**Validation Tests:**

- [ ] `prisma validate` passes
- [ ] All relations defined correctly
- [ ] Indexes for performance

---

### Step 2.1.2: Create Database Schema

**RED (Test)**: Write test expectations for schema
**GREEN (Implementation)**: Define complete schema

**User Model Requirements:**

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  passwordHash  String?
  image         String?
  role          Role      @default(STUDENT)

  // PDPA Compliance
  pdpaConsent         Boolean   @default(false)
  pdpaConsentDate     DateTime?
  marketingConsent    Boolean   @default(false)
  marketingConsentDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  accounts     Account[]
  sessions     Session[]
  orders       Order[]
  cart         Cart?
  progress     Progress[]
  reviews      Review[]
  achievements UserAchievement[]
}

enum Role {
  STUDENT
  ADMIN
  INSTRUCTOR
}
```

**Course Model:**

```prisma
model Course {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  description     String   @db.Text
  shortDescription String?

  // Pricing
  price             Decimal @db.Decimal(10, 2)
  compareAtPrice    Decimal? @db.Decimal(10, 2)
  gstIncluded       Boolean @default(true)

  // Content
  categoryId String
  images     String[]
  curriculum Json?

  // Metadata
  videoCount  Int
  duration    Int // in minutes
  level       CourseLevel
  featured    Boolean  @default(false)
  published   Boolean  @default(false)
  stock       Int?     // null for digital products

  // SEO
  metaTitle       String?
  metaDescription String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  category  Category   @relation(fields: [categoryId], references: [id])
  videos    Video[]
  orders    OrderItem[]
  cartItems CartItem[]
  progress  Progress[]
  reviews   Review[]
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

**Order Model (with GST):**

```prisma
model Order {
  id        String      @id @default(cuid())
  orderNumber String    @unique
  userId    String?
  status    OrderStatus @default(PENDING)

  // Pricing with GST
  subtotal        Decimal @db.Decimal(10, 2)
  gstAmount       Decimal @db.Decimal(10, 2) // 9% Singapore GST
  discountAmount  Decimal @default(0) @db.Decimal(10, 2)
  total           Decimal @db.Decimal(10, 2)
  currency        String  @default("SGD")

  // Payment
  stripePaymentIntentId String?

  // Customer Info
  customerEmail String
  customerName  String?
  billingAddress Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user   User?       @relation(fields: [userId], references: [id])
  items  OrderItem[]
  payment Payment?
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
  REFUNDED
}
```

**Additional Models:**

- Category, Cart, CartItem, Video, Progress, Review, Payment, Achievement, UserAchievement

**Indexes Required:**

- User.email (unique)
- Course.slug (unique)
- Course.categoryId + Course.published
- Order.userId + Order.createdAt
- Order.orderNumber (unique)
- Progress.userId + Progress.courseId
- Review.userId + Review.courseId (unique per user/course)

---

### Step 2.1.3: Create Migrations

**RED (Test)**: Database doesn't match schema
**GREEN (Implementation)**: Generate and apply migrations

**Commands:**

```bash
npx prisma migrate dev --name init
```

**Validation Tests:**

- [ ] Migration applies without errors
- [ ] All tables created in database
- [ ] Foreign keys properly set
- [ ] Indexes created

---

### Step 2.1.4: Seed Database

**RED (Test)**: Database is empty
**GREEN (Implementation)**: Create seed data

**Files to Create:**

1. `prisma/seed.ts` - Database seeding script

**Seed Data:**

- 4 courses (Sourdough, Viennoiserie, Pâtisserie, Artisan Breads)
- 2 categories (Bread, Pastry)
- 1 admin user
- Sample progress data
- Sample reviews

**Commands:**

```bash
npx prisma db seed
```

**Validation Tests:**

- [ ] Seed script runs successfully
- [ ] Data visible in Prisma Studio
- [ ] Relations populated correctly

---

### Step 2.1.5: Prisma Client Setup

**RED (Test)**: No database client configured
**GREEN (Implementation)**: Create singleton Prisma client

**Files to Create:**

1. `src/lib/prisma.ts` - Prisma client singleton

**Requirements:**

- Singleton pattern to prevent multiple instances
- Connection pooling configuration
- Error handling for database errors

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Phase 2.2: Password Utilities (Estimated: 1-2 hours)

### Step 2.2.1: Password Hashing

**RED (Test)**: Write tests for password hashing
**GREEN (Implementation)**: Implement bcrypt utilities

**Files to Create:**

1. `src/lib/auth/password.ts` - Password utilities
2. `src/lib/auth/password.test.ts` - Unit tests

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

  it("uses bcrypt with salt rounds 12", async () => {
    const hash = await hashPassword("test");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt pattern
  });
});
```

**Implementation:**

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## Phase 2.3: JWT Authentication (Estimated: 2-3 hours)

### Step 2.3.1: JWT Utilities

**RED (Test)**: Write JWT test expectations
**GREEN (Implementation)**: Implement JWT with Jose

**Files to Create:**

1. `src/lib/auth/jwt.ts` - JWT utilities
2. `src/lib/auth/jwt.test.ts` - Unit tests

**Functions:**

- `signAccessToken(payload: JWTPayload): Promise<string>`
- `signRefreshToken(payload: JWTPayload): Promise<string>`
- `verifyAccessToken(token: string): Promise<JWTPayload>`
- `verifyRefreshToken(token: string): Promise<JWTPayload>`

**TDD Tests:**

```typescript
describe("jwt", () => {
  it("signs and verifies access token", async () => {
    const payload = { userId: "123", email: "test@example.com" };
    const token = await signAccessToken(payload);
    const decoded = await verifyAccessToken(token);
    expect(decoded.userId).toBe("123");
  });

  it("rejects expired tokens", async () => {
    // Create expired token
    const expiredToken = await signTokenWithExpiry(payload, -1);
    await expect(verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it("rejects invalid signature", async () => {
    const token = await signAccessToken(payload);
    const tamperedToken = token.slice(0, -5) + "xxxxx";
    await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
  });
});
```

**Implementation:**

```typescript
import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!,
);

const ACCESS_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY = "30d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
  return payload as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
  return payload as JWTPayload;
}
```

---

### Step 2.3.2: Session Management

**RED (Test)**: No session handling
**GREEN (Implementation)**: Implement cookie-based sessions

**Files to Create:**

1. `src/lib/auth/session.ts` - Session management
2. `src/lib/auth/session.test.ts` - Unit tests

**Functions:**

- `createSession(userId: string, role: string): Promise<SessionData>`
- `getSession(): Promise<SessionData | null>`
- `refreshSession(refreshToken: string): Promise<SessionData>`
- `destroySession(): Promise<void>`

**Cookie Configuration:**

- HttpOnly: true
- Secure: process.env.NODE_ENV === 'production'
- SameSite: 'strict'
- Max-Age: 7 days (access), 30 days (refresh)

---

## Phase 2.4: Authentication API Routes (Estimated: 3-4 hours)

### Step 2.4.1: Registration API

**RED (Test)**: Write API test expectations
**GREEN (Implementation)**: Implement registration endpoint

**Files to Create:**

1. `src/app/api/auth/register/route.ts` - Registration endpoint
2. `src/app/api/auth/register/route.test.ts` - API tests

**Requirements:**

- Validate input with Zod schema
- Check email uniqueness
- Hash password with bcrypt
- Create user in database
- Issue JWT tokens
- Set HTTP-only cookies
- Send welcome email (optional for MVP)
- Return user data (excluding password)

**TDD Tests:**

```typescript
describe("POST /api/auth/register", () => {
  it("registers new user successfully", async () => {
    const response = await POST(createRequest(validRegistration));
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe(validRegistration.email);
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    // Create user first
    await prisma.user.create({ data: existingUser });

    const response = await POST(createRequest(validRegistration));
    expect(response.status).toBe(409);
  });

  it("validates password strength", async () => {
    const response = await POST(createRequest(weakPasswordData));
    expect(response.status).toBe(400);
  });

  it("requires PDPA consent", async () => {
    const response = await POST(createRequest(noConsentData));
    expect(response.status).toBe(400);
  });
});
```

---

### Step 2.4.2: Login API

**RED (Test)**: Write login API tests
**GREEN (Implementation)**: Implement login endpoint

**Files to Create:**

1. `src/app/api/auth/login/route.ts` - Login endpoint
2. `src/app/api/auth/login/route.test.ts` - API tests

**Requirements:**

- Validate credentials
- Verify password with bcrypt
- Issue JWT tokens
- Set HTTP-only cookies
- Return user data
- Track failed attempts (optional)

**TDD Tests:**

```typescript
describe("POST /api/auth/login", () => {
  it("logs in with valid credentials", async () => {
    const response = await POST(createRequest(validCredentials));
    expect(response.status).toBe(200);
    // Check cookies are set
    const cookies = response.headers.get("set-cookie");
    expect(cookies).toContain("access_token");
  });

  it("rejects invalid credentials", async () => {
    const response = await POST(createRequest(invalidCredentials));
    expect(response.status).toBe(401);
  });

  it("rejects non-existent user", async () => {
    const response = await POST(createRequest(unknownUser));
    expect(response.status).toBe(401);
  });
});
```

---

### Step 2.4.3: Logout & Current User APIs

**RED (Test)**: Write tests for logout and current user
**GREEN (Implementation)**: Implement endpoints

**Files to Create:**

1. `src/app/api/auth/logout/route.ts` - Logout endpoint
2. `src/app/api/auth/me/route.ts` - Current user endpoint

**Logout Requirements:**

- Clear HTTP-only cookies
- Blacklist token (optional for MVP)

**Current User Requirements:**

- Validate JWT from cookies
- Return sanitized user data
- Handle expired/invalid tokens

---

## Phase 2.5: Next.js Middleware (Estimated: 1-2 hours)

### Step 2.5.1: Route Protection Middleware

**RED (Test)**: No route protection
**GREEN (Implementation)**: Implement middleware

**Files to Create:**

1. `src/middleware.ts` - Next.js middleware
2. `src/middleware.test.ts` - Middleware tests

**Requirements:**

- Validate JWT from cookies
- Public routes whitelist
- Protected routes require authentication
- Admin routes require ADMIN role
- Redirect to login for unauthorized
- Attach user to request (optional)

**Public Routes:**

- `/`, `/courses`, `/courses/[slug]`
- `/login`, `/register`, `/forgot-password`
- `/api/auth/*`

**Protected Routes:**

- `/dashboard/*`
- `/checkout/*`
- `/learn/*`
- `/api/orders/*`, `/api/cart/*`

**Admin Routes:**

- `/admin/*`
- `/api/admin/*`

**Implementation:**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/auth/jwt";

const PUBLIC_ROUTES = [
  "/",
  "/courses",
  "/login",
  "/register",
  "/forgot-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if public route
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyAccessToken(token);

    // Check admin routes
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
```

---

## Phase 2.6: Authentication Components (Estimated: 3-4 hours)

### Step 2.6.1: Login Form Component

**RED (Test)**: No login form
**GREEN (Implementation)**: Create component with tests

**Files to Create:**

1. `src/components/auth/LoginForm.tsx` - Login form
2. `src/components/auth/LoginForm.test.tsx` - Component tests

**Requirements:**

- react-hook-form for form handling
- Zod validation schema
- Loading state during submission
- Error display
- "Remember me" checkbox
- Link to registration
- Link to forgot password

**Features:**

- Email & password inputs
- Client-side validation
- Server error handling
- Submit button with loading spinner
- Accessible form labels

---

### Step 2.6.2: Registration Form Component

**RED (Test)**: No registration form
**GREEN (Implementation)**: Create component

**Files to Create:**

1. `src/components/auth/RegisterForm.tsx` - Registration form
2. `src/components/auth/RegisterForm.test.tsx` - Component tests

**Requirements:**

- Name, email, password, confirm password inputs
- Password strength indicator
- PDPA consent checkbox (required)
- Marketing consent checkbox (optional)
- Terms of service link
- Submit button with loading state
- Link to login page

**Password Strength Indicator:**

- Weak: < 8 chars or missing requirements
- Medium: 8+ chars with 3/4 requirements
- Strong: 8+ chars with all 4 requirements

---

### Step 2.6.3: Auth Provider Hook

**RED (Test)**: No auth context
**GREEN (Implementation)**: Create useAuth hook

**Files to Create:**

1. `src/hooks/useAuth.ts` - Auth hook
2. `src/hooks/useAuth.test.ts` - Hook tests

**Requirements:**

- `user` - Current user or null
- `isLoading` - Loading state
- `login(email, password)` - Login function
- `register(data)` - Registration function
- `logout()` - Logout function
- Auto-fetch user on mount
- Handle token refresh

**Implementation:**

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  // Implementation
}
```

---

### Step 2.6.4: Protected Route Component

**RED (Test)**: No route protection component
**GREEN (Implementation)**: Create HOC

**Files to Create:**

1. `src/components/auth/ProtectedRoute.tsx` - Protected route wrapper

**Requirements:**

- Check authentication status
- Show loading state
- Redirect to login if not authenticated
- Optional role-based access
- Preserve redirect URL

---

## Phase 2.7: Authentication Pages (Estimated: 2 hours)

### Step 2.7.1: Login Page

**Files to Create:**

1. `src/app/login/page.tsx` - Login page

**Requirements:**

- Centered layout
- LoginForm component
- Link to registration
- Link to forgot password
- SEO metadata

---

### Step 2.7.2: Register Page

**Files to Create:**

1. `src/app/register/page.tsx` - Registration page

**Requirements:**

- Centered layout
- RegisterForm component
- Link to login
- PDPA notice
- SEO metadata

---

## Phase 2 Validation Checklist

### Pre-Phase Check

- [ ] Phase 1 complete and validated
- [ ] Database Docker container running
- [ ] Environment variables configured

### During Phase

- [ ] Every function has tests (TDD compliance)
- [ ] Tests pass before moving to next component
- [ ] No `any` types in auth code
- [ ] All API routes return proper HTTP status codes

### Post-Phase Validation

- [ ] `npx prisma migrate dev` applies successfully
- [ ] `npx prisma db seed` populates data
- [ ] `npm run test` passes (all auth tests)
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Login/Registration flow works end-to-end
- [ ] Middleware protects routes correctly
- [ ] JWT tokens validate correctly
- [ ] Passwords hashed securely

### Quality Gates

- [ ] Test coverage >80% for auth module
- [ ] All API endpoints documented
- [ ] Error handling comprehensive
- [ ] No secrets in code
- [ ] Cookie security configured
- [ ] Rate limiting considered (for production)

---

## Estimated Timeline

| Step                   | Estimated Time | Cumulative  |
| ---------------------- | -------------- | ----------- |
| 2.1 Database Schema    | 3-4 hours      | 3-4 hours   |
| 2.2 Password Utilities | 1-2 hours      | 4-6 hours   |
| 2.3 JWT Authentication | 2-3 hours      | 6-9 hours   |
| 2.4 API Routes         | 3-4 hours      | 9-13 hours  |
| 2.5 Middleware         | 1-2 hours      | 10-15 hours |
| 2.6 Components         | 3-4 hours      | 13-19 hours |
| 2.7 Pages              | 2 hours        | 15-21 hours |

**Total Estimated Time: 15-21 hours**

---

## Next Steps After Phase 2

1. Test complete authentication flow
2. Verify database connections
3. Review security implementation
4. Proceed to Phase 3: Product Catalog

**Phase 2 Success Criteria:**

- [ ] Database schema complete with migrations
- [ ] Authentication system fully functional
- [ ] Login/Registration working end-to-end
- [ ] Route protection active
- [ ] 100+ tests passing
- [ ] Security audit passed
