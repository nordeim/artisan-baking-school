Let me present the meticulous plan for Phase 2.4.2: Login API before proceeding:
---
Phase 2.4.2: Login API Implementation Plan
Objective
Create a secure /api/auth/login endpoint that validates credentials, issues JWT tokens via HTTP-only cookies, and returns sanitized user data.
Architecture Decisions
Security Considerations:
- Use timing-safe comparison for credential validation to prevent timing attacks
- Return identical error messages for "user not found" vs "wrong password" to prevent email enumeration
- bcrypt verification is computationally expensive by design (slows down brute force)
- Store refresh tokens in database for session invalidation capability
- Rate limiting consideration: 5 attempts per IP per 5 minutes (middleware layer)
Performance Decisions:
- Parallel database + bcrypt operations where possible
- Lazy JWT secret evaluation (already implemented)
- Minimal user data fetch (select only required fields)
Database Operations:
- Single Prisma query with include for user profile
- Use findUnique for indexed email lookup
- Exclude password hash from final response
---
Implementation Steps (TDD Approach)
Step 1: Write Failing Tests
src/app/api/auth/login/route.test.ts (10 test cases)
Tests will cover:
1. ✅ Valid credentials → 200 + cookies + user data
2. ✅ Non-existent user → 401 (generic "Invalid credentials")
3. ✅ Wrong password → 401 (same message as #2)
4. ✅ Missing email → 400 (validation error)
5. ✅ Invalid email format → 400
6. ✅ Missing password → 400
7. ✅ Password too short → 400
8. ✅ Sanitized response (no password hash)
9. ✅ Cookie attributes (HttpOnly, SameSite, Secure)
10. ✅ Refresh token stored in session table
Step 2: Implement Route Handler
src/app/api/auth/login/route.ts
- Zod validation with detailed errors
- Prisma user lookup
- bcrypt password verification
- createSession() integration
- Sanitized response
Step 3: Verify All Tests Pass
Run full test suite: 133/133 passing
Step 4: TypeScript & Lint Validation
npm run type-check && npm run lint
---
Technical Specifications
Endpoint: POST /api/auth/login
Request Body:
{
  email: string (valid email),
  password: string (min 8 chars)
}
Success Response (200):
{
  user: {
    id: uuid,
    email: user@example.com,
    name: John Doe,
    role: STUDENT,
    createdAt: 2026-01-25T...
  },
  message: Login successful
}
Error Responses:
- 400: Validation error (invalid email format, missing fields)
- 401: Invalid credentials (generic, same for all auth failures)
- 500: Internal server error
Cookies Set:
- auth-token: JWT access token (7 days, HttpOnly, Secure, SameSite=strict, Path=/)
- refresh-token: JWT refresh token (30 days, HttpOnly, Secure, SameSite=strict, Path=/api/auth/refresh)
---
Code Structure
// route.ts structure
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'An unexpected error occurred'
} as const;
export async function POST(request: NextRequest) {
  // 1. Parse & validate body
  // 2. Lookup user (don't reveal if exists)
  // 3. Verify password (constant time comparison)
  // 4. Create session (tokens + cookies)
  // 5. Return sanitized user
}
---
Dependencies & Pre-requisites
✅ Already Completed:
- loginSchema validation in src/lib/validations/auth.ts
- verifyPassword() utility in src/lib/auth/password.ts
- createSession() in src/lib/auth/session.ts
- Prisma client configured
- Test utilities in src/test/setup.ts
🔧 No Additional Dependencies Required
---
Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timing attacks | Low | High | Same error message for all failures, bcrypt is slow by design |
| JWT secret exposure | Low | Critical | Already using lazy evaluation, env validation |
| Database query injection | Very Low | High | Prisma ORM parameterized queries |
| Response data leak | Low | High | Explicit select/omit in response, tests verify |
| Session fixation | Medium | Medium | New session ID on login, test coverage |
---
Success Criteria
- [ ] 10 comprehensive tests written (failing first)
- [ ] Login route implemented
- [ ] All 133 tests passing
- [ ] TypeScript strict mode: 0 errors
- [ ] ESLint: 0 warnings, 0 errors
- [ ] No any types used
- [ ] Error messages are user-friendly but don't leak system info
- [ ] Cookies use correct security attributes
- [ ] Response excludes password hash completely
---
Estimated Effort: 45-60 minutes (following TDD strictly)
