# Role-Based Authentication and Access Control System

This document explains the role-based access control (RBAC) system implemented in the AquaLearn Swimming Center Management application. The system restricts access to specific parts of the application based on user roles.

## Overview

The access control system uses two role properties in the user data:

1. `role_system` - Backend system roles (used for API permissions)
2. `role_front` - Frontend UI roles (used for UI routing and layout)

User roles can be one of the following:

- `admin` - Full system access
- `manager` - Access to management features
- `instructor` - Access to instructor features
- `student` - Access to student features

## Implementation Components

### 1. API Utility Functions (`/api/role-utils.ts`)

Core utilities for working with roles:

```typescript
// Get the frontend role of the authenticated user
getUserFrontendRole(): string

// Check if the user has the required frontend role
hasRequiredRole(requiredRoles: RoleFront[]): boolean

// Get dashboard path based on user's role
getUserDashboardPath(): string
```

### 2. RoleGuard Component (`/components/role-guard.tsx`)

Protects routes based on user roles:

```tsx
<RoleGuard
  allowedRoles={["admin", "manager"]}
  fallbackUrl='/login'
>
  {/* Protected content here */}
</RoleGuard>
```

### 3. Dashboard Layout with Role Awareness (`/components/dashboard-layout-v2.tsx`)

Layout component that automatically shows navigation items based on user role:

```tsx
<DashboardLayout userRole='student'>
  {/* Dashboard content here */}
</DashboardLayout>
```

### 4. Middleware Protection (`/middleware.ts`)

Prevents unauthorized access at the Next.js route level:

- Intercepts navigation to `/dashboard/*` routes
- Validates token presence
- Checks user role against route pattern
- Redirects unauthorized access

### 5. React Hook (`/hooks/useUserRole.ts`)

Custom hook for easily accessing role information in components:

```tsx
const {
  role, // Current user's role
  isAdmin, // Boolean flags for role checking
  isManager,
  isInstructor,
  isStudent,
  isLoading, // Loading state
  user, // User object
} = useUserRole();
```

## Usage Guidelines

### Protecting a Route with RoleGuard

```tsx
import RoleGuard from "@/components/role-guard";

export default function AdminPage() {
  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallbackUrl='/'
    >
      <div>Admin Dashboard Content</div>
    </RoleGuard>
  );
}
```

### Using the Dashboard Layout with Role Awareness

```tsx
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function StudentDashboard() {
  return (
    <DashboardLayout userRole='student'>
      <h1>Student Dashboard</h1>
      {/* Other content */}
    </DashboardLayout>
  );
}
```

### Conditional UI Based on Role

```tsx
import { useUserRole } from "@/hooks/useUserRole";

export default function MyComponent() {
  const { isAdmin, isManager } = useUserRole();

  return (
    <div>
      <h1>Welcome</h1>

      {/* Only visible to admins */}
      {isAdmin && (
        <div className='admin-controls'>
          <h2>Admin Controls</h2>
          {/* Admin-specific UI */}
        </div>
      )}

      {/* Visible to both admins and managers */}
      {(isAdmin || isManager) && (
        <div className='management-section'>
          <h2>Management Section</h2>
          {/* Management UI */}
        </div>
      )}
    </div>
  );
}
```

## Workflow for User Authentication and Role-Based Access

1. **Login Process:**

   - User enters credentials at `/login`
   - After successful authentication, the system checks `role_front` (or falls back to `role_system`)
   - User is redirected to the appropriate dashboard based on role

2. **Protected Route Access:**

   - Middleware validates authentication token for protected routes
   - Middleware checks if the user's role matches the accessed route
   - RoleGuard component provides additional protection at the component level

3. **Dashboard Navigation:**
   - Dashboard layout automatically displays navigation items based on the user's role
   - The hook `useUserRole()` provides role information to conditionally render UI elements

## Best Practices

1. **Always use RoleGuard** for sensitive components that should be restricted based on user role
2. **Use `dashboard-layout-v2`** instead of the original dashboard layout for automatic role-based navigation
3. **Use the `useUserRole` hook** for conditional UI rendering based on roles
4. **Validate roles in both frontend and backend** for comprehensive security

## Testing

To test the role-based access control system:

1. Log in with different user accounts having different roles
2. Attempt to access different dashboard areas
3. Verify that users are redirected or denied access appropriately
4. Test that UI elements correctly appear or hide based on user roles
