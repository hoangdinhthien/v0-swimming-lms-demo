# Staff Data API Implementation Summary

## Overview

This document summarizes the implementation of the staff data API system that integrates with the real API endpoint provided by the user. The system allows staff members to fetch data based on their permissions with module-specific headers.

## API Integration

- **Base URL**: `https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/workflow-process/staff`
- **Authentication**: Uses JWT token in Authorization header and tenant ID in x-tenant-id header
- **Service Headers**: Each request passes the module name in the `service` header

## Implementation Structure

### 1. Core API Functions (`api/staff-data/staff-data-api.ts`)

- `fetchStaffData(module)` - Generic function that accepts module parameter
- `fetchStaffCourses()` - Fetches Course module data
- `fetchStaffClasses()` - Fetches Class module data
- `fetchStaffOrders()` - Fetches Order module data
- `fetchStaffUsers()` - Fetches User module data
- `fetchStaffNews()` - Fetches News module data
- `fetchStaffApplications()` - Fetches Application module data

### 2. React Hooks (`hooks/useStaffData.ts`)

- `useStaffCourses()` - Hook for Course module with permission checking
- `useStaffClasses()` - Hook for Class module with permission checking
- `useStaffOrders()` - Hook for Order module with permission checking
- `useStaffUsers()` - Hook for User module with permission checking
- `useStaffNews()` - Hook for News module with permission checking
- `useStaffApplications()` - Hook for Application module with permission checking

Each hook provides:

- `data` - API response data
- `loading` - Loading state
- `error` - Error message if any
- `refetch` - Function to refresh data
- `hasPermission` - Boolean indicating if user has access to this module

### 3. Updated Staff Pages

All staff pages have been updated to use the new data API system:

#### `/app/dashboard/staff/courses/page.tsx`

- Uses `useStaffCourses()` hook
- Displays API response with status code and raw data
- Includes refresh functionality and permission checking

#### `/app/dashboard/staff/classes/page.tsx`

- Uses `useStaffClasses()` hook
- Shows real-time data from Class module API

#### `/app/dashboard/staff/orders/page.tsx`

- Uses `useStaffOrders()` hook
- Displays order data from Order module API

#### `/app/dashboard/staff/students/page.tsx`

- Uses `useStaffUsers()` hook
- Shows student/user data from User module API

#### `/app/dashboard/staff/instructors/page.tsx`

- Uses `useStaffUsers()` hook
- Displays instructor data from User module API

#### `/app/dashboard/staff/news/page.tsx`

- Uses `useStaffNews()` hook
- Shows news data from News module API

#### `/app/dashboard/staff/applications/page.tsx`

- Uses `useStaffApplications()` hook
- Displays application data from Application module API

## How It Works

1. **Permission Check**: Each hook first checks if the staff member has permission for the specific module using `useStaffPermissions()`

2. **Service Header**: The module name is extracted from the staff permissions and passed as the `service` header in the API request

3. **Data Fetching**: API calls are made to the staff endpoint with proper authentication and module headers

4. **Response Handling**: API responses are displayed with status codes and raw data for development/debugging

5. **Error Handling**: Comprehensive error handling with retry functionality

## Key Features

- **Permission-Based Access**: Only shows data for modules the staff member has access to
- **Real-Time Data**: Uses actual API endpoints for live data
- **Service Headers**: Passes module names in 'service' header as required by the API
- **Error Handling**: Comprehensive error states and retry mechanisms
- **Loading States**: Proper loading indicators during data fetching
- **Refresh Functionality**: Manual refresh capability on all pages

## Next Steps

1. **Test with Real Authentication**: Test the complete flow with actual JWT tokens and tenant IDs
2. **Data Formatting**: Once API responses are confirmed, implement proper data display components
3. **CRUD Operations**: Implement create, update, and delete operations for each module
4. **Advanced Filtering**: Add search and filter capabilities for large datasets

## Dependencies

- `useAuth` hook for authentication tokens
- `useStaffPermissions` hook for permission checking
- Staff permission API system for module access control
- React Query or similar for advanced data caching (future enhancement)

This implementation provides a solid foundation for the staff data management system with real API integration and proper permission-based access control.
