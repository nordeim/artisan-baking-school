# Phase 3.5: Admin API Implementation Plan

## Comprehensive Plan for Backend Admin Endpoints

---

## Executive Summary

**Objective**: Implement 4 admin API endpoints to make the admin dashboard fully functional
**Estimated Duration**: 35-45 minutes
**Critical Success Factors**: Security (ADMIN-only access), Type safety, Comprehensive testing, Error handling

---

## Phase 1: Analysis & Architecture (5 minutes)

### Current State Assessment

**Existing Infrastructure**:

- ✅ Prisma ORM with User model (STUDENT, ADMIN, INSTRUCTOR roles)
- ✅ JWT session management with role-based middleware
- ✅ Admin hooks expecting specific endpoints
- ✅ Error handling patterns established
- ✅ `/api/auth/*` routes as reference patterns

**Missing Components**:

- ❌ `GET /api/admin/stats` - Dashboard statistics
- ❌ `GET /api/admin/users` - User listing with search
- ❌ `PUT /api/admin/users/{id}/role` - Role updates
- ❌ `DELETE /api/admin/users/{id}` - User deletion

### Endpoint Specifications

#### 1. GET /api/admin/stats

```typescript
// Response
interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersThisMonth: number;
  }
}

// Implementation
- Count total users
- Count users with recent sessions (activeUsers - last 30 days)
- Count users where role = ADMIN
- Count users created this month
```

#### 2. GET /api/admin/users

```typescript
// Query Parameters
interface UserListQuery {
  search?: string; // Search by name or email
  role?: string; // Filter by role
  page?: number; // Pagination (default: 1)
  limit?: number; // Items per page (default: 20, max: 100)
}

// Response
interface UserListResponse {
  users: ManagedUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ManagedUser
interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  image: string | null;
  // Sensitive data EXCLUDED: passwordHash, marketingConsent, etc.
}
```

#### 3. PUT /api/admin/users/{id}/role

```typescript
// Request Body
interface UpdateRoleRequest {
  role: "STUDENT" | "ADMIN" | "INSTRUCTOR";
}

// Response
interface UpdateRoleResponse {
  success: boolean;
  user: ManagedUser;
  message: string;
}
```

#### 4. DELETE /api/admin/users/{id}

```typescript
// Response
interface DeleteUserResponse {
  success: boolean;
  message: string;
}
```

---

## Phase 2: Implementation Plan (25 minutes)

### Task 2.1: Create API Directory Structure (1 min)

```
src/app/api/admin/
├── stats/
│   └── route.ts          # GET /api/admin/stats
├── users/
│   ├── route.ts          # GET /api/admin/users
│   └── [id]/
│       └── route.ts      # PUT & DELETE /api/admin/users/{id}
```

### Task 2.2: Implement GET /api/admin/stats (5 min)

**Prisma Queries Needed**:

```typescript
// Total users
prisma.user.count();

// Active users (with sessions in last 30 days)
prisma.user.count({
  where: { sessions: { some: { expires: { gt: thirtyDaysAgo } } } },
});

// Admin users
prisma.user.count({ where: { role: "ADMIN" } });

// New users this month
prisma.user.count({
  where: { createdAt: { gte: firstDayOfMonth } },
});
```

**Error Scenarios**:

- Database connection errors → 500 with generic message
- Authentication failure → 401 (handled by middleware)
- Non-admin access → 403 (handled by middleware)

### Task 2.3: Implement GET /api/admin/users (6 min)

**Implementation Details**:

- Search by email (case-insensitive contains) OR name (case-insensitive contains)
- Pagination with Prisma `skip` and `take`
- Sort by `createdAt` descending (newest first)
- Select only safe fields (exclude passwordHash, marketingConsent, etc.)

**Prisma Query**:

```typescript
prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ],
  },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    image: true,
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```

### Task 2.4: Implement PUT /api/admin/users/{id}/role (5 min)

**Validation**:

- Role must be one of: STUDENT, ADMIN, INSTRUCTOR
- Cannot change own role (prevent self-demotion)
- User must exist

**Security**:

- Extract current user from session
- Verify not attempting to modify self
- Log role changes for audit trail (optional but recommended)

### Task 2.5: Implement DELETE /api/admin/users/{id} (4 min)

**Validation**:

- Cannot delete self (prevent admin lockout)
- User must exist
- Consider: Cannot delete last admin user (safety check)

**Cascade Handling**:

- Prisma schema has `onDelete: Cascade` for relations
- Deleting user auto-deletes: accounts, sessions, orders, cart, progress, reviews, achievements

### Task 2.6: Create Admin Validation Schemas (2 min)

Create `/src/lib/validations/admin.ts`:

```typescript
import { z } from "zod";

export const updateRoleSchema = z.object({
  role: z.enum(["STUDENT", "ADMIN", "INSTRUCTOR"]),
});

export const userListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["STUDENT", "ADMIN", "INSTRUCTOR"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
```

### Task 2.7: Create Admin Types (2 min)

Create `/src/lib/types/admin.ts`:

```typescript
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "ADMIN" | "INSTRUCTOR";
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  image: string | null;
}

export interface UserListResponse {
  users: ManagedUser[];
  total: number;
  page: number;
  totalPages: number;
}
```

---

## Phase 3: Testing Strategy (10 minutes)

### Test Categories

#### Unit Tests for Route Handlers

**Test File**: `/src/app/api/admin/stats/route.test.ts`

- ✅ Returns 401 without authentication
- ✅ Returns 403 for non-admin user
- ✅ Returns correct stats for admin
- ✅ Handles database errors gracefully

**Test File**: `/src/app/api/admin/users/route.test.ts`

- ✅ Returns 401 without authentication
- ✅ Returns 403 for non-admin user
- ✅ Returns paginated user list
- ✅ Search filters work correctly
- ✅ Role filter works correctly
- ✅ Pagination works (page, limit)

**Test File**: `/src/app/api/admin/users/[id]/route.test.ts`

- ✅ PUT: Returns 401 without auth
- ✅ PUT: Returns 403 for non-admin
- ✅ PUT: Updates role successfully
- ✅ PUT: Rejects invalid role values
- ✅ PUT: Prevents self-role-change
- ✅ DELETE: Returns 401 without auth
- ✅ DELETE: Returns 403 for non-admin
- ✅ DELETE: Deletes user successfully
- ✅ DELETE: Prevents self-deletion
- ✅ DELETE: Returns 404 for non-existent user

### Test Data Setup

```typescript
// Create test users with different roles
const adminUser = await prisma.user.create({
  data: { email: "admin@test.com", role: "ADMIN", passwordHash: "hashed" },
});

const regularUser = await prisma.user.create({
  data: { email: "user@test.com", role: "STUDENT", passwordHash: "hashed" },
});

// Create JWT tokens for authentication
const adminToken = await generateTestToken({
  userId: adminUser.id,
  role: "ADMIN",
});
const userToken = await generateTestToken({
  userId: regularUser.id,
  role: "STUDENT",
});
```

### Integration Tests

**Test File**: `/src/app/api/admin/admin.integration.test.ts`

- End-to-end admin workflow
- Verify hooks work with real endpoints
- Performance test: Large user list pagination

---

## Phase 4: Security Considerations

### Authentication & Authorization

1. **Middleware Protection**: `/api/admin/*` already protected by middleware.ts
2. **Role Verification**: Middleware enforces ADMIN role
3. **Session Validation**: JWT tokens verified on every request
4. **Audit Trail**: Log admin actions (optional enhancement)

### Input Validation

1. **Zod Schemas**: Strict validation on all inputs
2. **SQL Injection**: Prisma ORM prevents injection attacks
3. **ID Validation**: Validate user IDs are valid CUIDs before queries

### Data Protection

1. **Field Selection**: Never return passwordHash or sensitive fields
2. **Self-Protection**: Prevent admin from deleting/demoting themselves
3. **Last Admin**: Prevent deletion of last admin user (safety check)

---

## Phase 5: Implementation Checklist

### Before Implementation

- [ ] Review existing auth route patterns
- [ ] Verify Prisma client is properly imported
- [ ] Check middleware.ts admin protection logic

### During Implementation

- [ ] Create route files with proper TypeScript types
- [ ] Follow existing error handling patterns
- [ ] Use consistent response format
- [ ] Add comprehensive logging for errors
- [ ] Sanitize user data in responses

### After Implementation

- [ ] Run TypeScript type check
- [ ] Run all tests (expect 401+ new tests passing)
- [ ] Test manually via browser or Postman
- [ ] Verify admin dashboard works with real data
- [ ] Check for console errors

---

## Phase 6: Risk Assessment

### High Risk

- **Accidental User Deletion**: Implement soft delete or confirmation
- **Role Escalation**: Strict validation prevents invalid roles
- **Data Exposure**: Field selection prevents sensitive data leak

### Medium Risk

- **Performance**: Large user lists need pagination
- **Audit Trail**: No logging of admin actions (acceptable for MVP)

### Low Risk

- **Race Conditions**: Concurrent role updates (rare in practice)

---

## Success Criteria

- [ ] All 4 endpoints return correct data structure
- [ ] Authentication enforced (401 for no session)
- [ ] Authorization enforced (403 for non-admin)
- [ ] Input validation prevents invalid data
- [ ] Response times < 500ms for all endpoints
- [ ] 100% test coverage for admin API routes
- [ ] Admin dashboard renders real data
- [ ] User management features work (CRUD)

---

## Next Steps After Completion

1. **Integration Testing**: Verify hooks work with endpoints
2. **Performance Optimization**: Add caching if needed
3. **Audit Logging**: Add admin action logging
4. **Soft Delete**: Consider soft delete instead of hard delete
5. **Bulk Operations**: Add bulk user operations (future enhancement)

---

## Files to Create/Modify

### New Files

1. `/src/app/api/admin/stats/route.ts`
2. `/src/app/api/admin/users/route.ts`
3. `/src/app/api/admin/users/[id]/route.ts`
4. `/src/lib/validations/admin.ts`
5. `/src/lib/types/admin.ts`
6. `/src/app/api/admin/stats/route.test.ts`
7. `/src/app/api/admin/users/route.test.ts`
8. `/src/app/api/admin/users/[id]/route.test.ts`

### Modified Files

- None (all new additions)

---

**Ready to proceed with implementation?**
