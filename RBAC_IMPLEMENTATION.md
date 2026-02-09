# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the role-based access control system implemented for the GastroBI+ backend, enabling different user roles (WAITER, STAFF, MANAGER, OWNER, ADMIN) to access only authorized features.

## User Roles

### WAITER
- **Description**: Restaurant floor staff for taking orders and managing tables
- **Access Level**: Limited (POS operations)
- **Permissions**:
  - ✅ Create orders
  - ✅ Read orders
  - ✅ Update order status
  - ✅ Cancel orders
  - ✅ View products/menu
  - ✅ View categories
  - ✅ View tables
  - ✅ Update table status
  - ✅ Redeem loyalty rewards
  - ✅ View customer loyalty history
  - ❌ Create/edit/delete products
  - ❌ Create/edit/delete categories
  - ❌ Create/edit/delete tables
  - ❌ Access reports/analytics
  - ❌ Access customer management
  - ❌ Access campaigns
  - ❌ Create/edit loyalty rules

### STAFF
- **Description**: Kitchen/bar staff for order management
- **Access Level**: Limited (POS operations, same as WAITER)
- **Permissions**: Same as WAITER

### MANAGER
- **Description**: Restaurant shift manager
- **Access Level**: Full restaurant operations
- **Permissions**:
  - ✅ All WAITER/STAFF permissions
  - ✅ Create/edit/delete products
  - ✅ Create/edit/delete categories
  - ✅ Create/edit/delete tables
  - ✅ View reports/analytics
  - ✅ Manage customers
  - ✅ Create campaigns
  - ✅ Manage loyalty rules

### OWNER
- **Description**: Restaurant owner
- **Access Level**: Full restaurant operations
- **Permissions**: Same as MANAGER

### ADMIN
- **Description**: Platform administrator
- **Access Level**: Platform-wide administration
- **Permissions**:
  - ✅ Create/edit/delete restaurants
  - ✅ View all subscriptions
  - ✅ Manage white-label configurations
  - ❌ Limited to `/admin/*` routes

### SUPER_ADMIN
- **Description**: Platform super administrator
- **Access Level**: Full platform administration
- **Permissions**: All ADMIN permissions + system-level operations

## Implementation Details

### 1. Prisma Schema
Added WAITER to UserRole enum:
```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  OWNER
  MANAGER
  STAFF
  WAITER  // New role
}
```

### 2. Route Protection

#### RolesGuard
Located in: `src/common/guards/roles.guard.ts`
- Validates user's role against `@Roles()` decorator
- Throws `ForbiddenException` if user lacks required role
- Works in conjunction with `JwtAuthGuard` and `TenantGuard`

#### Roles Decorator
Located in: `src/common/decorators/roles.decorator.ts`
- Applied to controller methods to specify required roles
- Usage: `@Roles(UserRole.OWNER, UserRole.MANAGER)`

### 3. Controllers Protected

#### OrdersController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// POST /orders - OWNER, MANAGER, STAFF, WAITER
// GET /orders - OWNER, MANAGER, STAFF, WAITER
// GET /orders/:id - OWNER, MANAGER, STAFF, WAITER
// PATCH /orders/:id/status - OWNER, MANAGER, STAFF, WAITER
// POST /orders/:id/cancel - OWNER, MANAGER, STAFF, WAITER
// GET /orders/reports - OWNER, MANAGER only
```

#### ProductsController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// POST /products - OWNER, MANAGER
// GET /products - OWNER, MANAGER, STAFF, WAITER
// GET /products/:id - OWNER, MANAGER, STAFF, WAITER
// PATCH /products/:id - OWNER, MANAGER
// DELETE /products/:id - OWNER, MANAGER
// PATCH /products/:id/toggle - OWNER, MANAGER
// PATCH /products/reorder - OWNER, MANAGER
```

#### CategoriesController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// POST /categories - OWNER, MANAGER
// GET /categories - OWNER, MANAGER, STAFF, WAITER
// GET /categories/:id - OWNER, MANAGER, STAFF, WAITER
// PATCH /categories/:id - OWNER, MANAGER
// DELETE /categories/:id - OWNER, MANAGER
// PATCH /categories/reorder - OWNER, MANAGER
```

#### TablesController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// POST /tables - OWNER, MANAGER
// GET /tables - OWNER, MANAGER, STAFF, WAITER
// GET /tables/:id - OWNER, MANAGER, STAFF, WAITER
// PATCH /tables/:id - OWNER, MANAGER
// DELETE /tables/:id - OWNER, MANAGER
// PATCH /tables/:id/status - OWNER, MANAGER, STAFF, WAITER
```

#### CustomersController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// All operations (POST, GET, PATCH, DELETE) - OWNER, MANAGER only
```

#### CampaignsController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// All operations (POST, GET, PATCH, DELETE) - OWNER, MANAGER only
```

#### LoyaltyController
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
// Rules management (POST, GET, PATCH, DELETE) - OWNER, MANAGER only
// Rewards management (POST, GET, PATCH, DELETE) - OWNER, MANAGER only
// POST /loyalty/redeem - OWNER, MANAGER, STAFF, WAITER
// GET /loyalty/history/:customerId - OWNER, MANAGER, STAFF, WAITER
```

## Creating a Waiter User

### Endpoint
```
POST /api/v1/users/waiter
Authorization: Bearer <jwt-token>
X-Restaurant-ID: <restaurant-id> (via TenantGuard)
```

### Request Body
```json
{
  "fullName": "João Silva",
  "email": "joao@restaurant.com",
  "password": "secure_password_123",
  "restaurantId": "uuid-of-restaurant"
}
```

### Response
```json
{
  "id": "uuid",
  "email": "joao@restaurant.com",
  "fullName": "João Silva",
  "type": "RESTAURANT",
  "role": "WAITER",
  "isActive": true,
  "createdAt": "2024-02-09T10:30:00Z"
}
```

### Authorization
- Only users with `OWNER` or `MANAGER` role can create waiters
- Waiter is created for the specified restaurant
- Email must be unique across the system
- Password is hashed using bcrypt
- Action is logged to audit trail

## Security Features

1. **Role-Based Route Protection**: Every protected route validates the user's role
2. **Multi-Tenancy**: TenantGuard ensures users can only access their restaurant's data
3. **JWT Authentication**: JwtAuthGuard validates token validity and expiration
4. **Audit Logging**: All privileged operations are logged with user ID and timestamp
5. **Password Security**: Passwords hashed with bcrypt before storage
6. **Email Uniqueness**: Email validation prevents duplicate user accounts

## Testing Role Access

### Test Creating a Waiter (OWNER/MANAGER only)
```bash
curl -X POST http://localhost:3000/api/v1/users/waiter \
  -H "Authorization: Bearer <manager-token>" \
  -H "Content-Type: application/json" \
  -H "X-Restaurant-ID: <restaurant-id>" \
  -d '{
    "fullName": "Waiter Name",
    "email": "waiter@example.com",
    "password": "password123",
    "restaurantId": "<restaurant-id>"
  }'
```

### Test Waiter Access (Should Succeed)
```bash
curl http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <waiter-token>" \
  -H "X-Restaurant-ID: <restaurant-id>"
```

### Test Waiter Access to Admin Route (Should Fail)
```bash
curl http://localhost:3000/api/v1/products \
  -X POST \
  -H "Authorization: Bearer <waiter-token>" \
  -H "X-Restaurant-ID: <restaurant-id>" \
  -d '{"name": "New Product", "price": 10}'
  
# Returns: 403 Forbidden
```

## Files Modified

1. **prisma/schema.prisma**
   - Added WAITER to UserRole enum

2. **src/users/dto/create-waiter.dto.ts** (NEW)
   - DTO for waiter creation with validation

3. **src/users/users.service.ts**
   - Added `createWaiter()` method with permission verification

4. **src/users/users.controller.ts**
   - Added POST `/users/waiter` endpoint
   - Added RolesGuard and Roles decorator imports

5. **src/orders/orders.controller.ts**
   - Added RolesGuard and @Roles() to all endpoints

6. **src/products/products.controller.ts**
   - Added RolesGuard and @Roles() to all endpoints

7. **src/categories/categories.controller.ts**
   - Added RolesGuard and @Roles() to all endpoints

8. **src/tables/tables.controller.ts**
   - Added RolesGuard and @Roles() to all endpoints

9. **src/customers/customers.controller.ts**
   - Added RolesGuard and @Roles() to all endpoints

10. **src/campaigns/campaigns.controller.ts**
    - Added RolesGuard and @Roles() to all endpoints

11. **src/loyalty/loyalty.controller.ts**
    - Added RolesGuard and @Roles() to all endpoints

## Migration Steps

1. Generate Prisma client with new schema:
   ```bash
   npx prisma generate
   ```

2. Apply database migration (if using `prisma migrate`):
   ```bash
   npx prisma migrate deploy
   ```

3. Restart backend service

## Notes

- WAITER and STAFF roles have identical permissions
- AdminGuard-protected routes (e.g., `/admin/*`) are unaffected by this RBAC implementation
- Multi-restaurant owners can switch between restaurants and maintain their OWNER role
- Role cannot be changed via user update endpoint; only via admin operations
- All operations maintain audit trail with user ID and timestamp

## Future Enhancements

1. Dynamic permission assignment
2. Resource-level permissions (e.g., specific product/category access)
3. Time-based role restrictions
4. Mobile app integration with role enforcement
5. Dashboard showing role-based analytics
