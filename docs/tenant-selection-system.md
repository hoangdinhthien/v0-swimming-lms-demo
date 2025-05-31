# Tenant Selection System

This document explains how the tenant selection system works in the AquaLearn application.

## Overview

The tenant selection system allows users to choose which tenant (organization/facility) they want to access after logging in. This is particularly useful for administrators or managers who may have access to multiple swimming facilities or organizations.

## How it Works

### 1. Login Flow

1. User logs in at `/login`
2. After successful authentication, user is redirected to `/tenant-selection`
3. User selects from available tenants
4. User is redirected to the appropriate dashboard

### 2. API Integration

- **Fetch Available Tenants**: `GET /api/v1/workflow-process/tenants-available`
  - Requires authentication (Bearer token)
  - Returns list of tenants the user can access
- **Tenant-Specific Data**: All subsequent API calls include `x-tenant-id` header
  - Example: `GET /api/v1/workflow-process/public/news`
  - The API automatically filters data based on the tenant ID

### 3. Frontend Components

#### TenantProvider

- Context provider that manages selected tenant state
- Stores tenant ID in localStorage for persistence
- Provides `useTenant()` hook for components

#### withTenantGuard HOC

- Higher-order component that protects dashboard routes
- Automatically redirects to tenant selection if no tenant is selected
- Ensures users cannot access dashboard without selecting a tenant

#### TenantInfo Component

- Displays current selected tenant information
- Allows users to switch tenants
- Shows tenant connection status

### 4. API Response Structure

#### Available Tenants Response

```json
{
  "data": [
    [
      [
        {
          "_id": "68386a9fa7f8e9bc9e5836ce",
          "tenant_id": {
            "_id": "67cabc98c87dc080914265d4",
            "title": "default"
          }
        }
      ]
    ]
  ],
  "message": "Success",
  "statusCode": 200
}
```

#### Tenant-Specific Data Response

```json
{
  "data": [
    [
      {
        "data": [
          {
            "_id": "6831dee47e7adf404d042afc",
            "title": "Khai giảng khóa học bơi hè 2025",
            "content": "...",
            "tenant_id": "67cabc98c87dc080914265d4"
          }
        ]
      }
    ]
  ],
  "message": "Success",
  "statusCode": 200
}
```

### 5. Usage Examples

#### Using the Tenant Hook

```tsx
import { useTenant } from "@/components/tenant-provider";

function MyComponent() {
  const { selectedTenantId, setSelectedTenant, clearTenant } = useTenant();

  // Component logic here
}
```

#### Protecting a Dashboard Route

```tsx
import { withTenantGuard } from "@/components/tenant-provider";

function MyDashboard() {
  // Dashboard component logic
}

export default withTenantGuard(MyDashboard);
```

#### Making API Calls with Tenant Context

```tsx
import { apiGet } from "@/api/api-utils";

// This automatically includes the x-tenant-id header
const response = await apiGet("/api/v1/workflow-process/public/news");
```

### 6. File Structure

```
app/
├── tenant-selection/
│   └── page.tsx              # Tenant selection page
├── dashboard/
│   ├── admin/page.tsx        # Protected with tenant guard
│   ├── manager/page.tsx      # Protected with tenant guard
│   ├── instructor/page.tsx   # Protected with tenant guard
│   └── student/page.tsx      # Protected with tenant guard

components/
├── tenant-provider.tsx       # Tenant context and guard
└── tenant-info.tsx          # Current tenant display

api/
├── tenant-api.ts            # Tenant-related API functions
└── api-utils.ts             # API utilities with tenant header
```

### 7. Security Features

- **Authentication Required**: Tenant selection requires valid login
- **Role-Based Access**: Users only see tenants they have access to
- **Automatic Headers**: API calls automatically include tenant context
- **Route Protection**: Dashboard routes require tenant selection

### 8. User Experience

1. **Seamless Flow**: Automatic redirect after login
2. **Persistence**: Selected tenant is remembered across sessions
3. **Easy Switching**: Users can change tenants without re-login
4. **Visual Feedback**: Clear indication of current tenant
5. **Loading States**: Proper loading indicators during API calls

This system ensures that users can only access data from tenants they're authorized to view, while providing a smooth user experience for multi-tenant access scenarios.
