import { getAuthenticatedUser } from "./auth-utils";

// Define role types for better type safety
export type RoleSystem =
  | "manager"
  | "admin"
  | "instructor"
  | "student"
  | string;
export type RoleFront = "manager" | "admin" | "instructor" | "student" | string;

/**
 * Get the frontend role of the authenticated user
 * Now properly detects both manager and staff roles
 * @returns {string} The frontend role ("manager", "staff", etc.) or empty string if no auth
 */
export function getUserFrontendRole(): string {
  const user = getAuthenticatedUser();
  if (!user) return "";

  console.log("[getUserFrontendRole] User data:", user);

  // Check for staff role first
  if (hasSpecificRole(user, "staff")) {
    console.log("[getUserFrontendRole] Detected staff role");
    return "staff";
  }

  // Check for manager role
  if (hasSpecificRole(user, "manager")) {
    console.log("[getUserFrontendRole] Detected manager role");
    return "manager";
  }

  // Check for other roles
  if (hasSpecificRole(user, "admin")) {
    console.log("[getUserFrontendRole] Detected admin role");
    return "admin";
  }

  if (hasSpecificRole(user, "instructor")) {
    console.log("[getUserFrontendRole] Detected instructor role");
    return "instructor";
  }

  if (hasSpecificRole(user, "student")) {
    console.log("[getUserFrontendRole] Detected student role");
    return "student";
  }

  console.log(
    "[getUserFrontendRole] No specific role found, defaulting to manager"
  );
  return "manager"; // Default fallback
}

/**
 * Helper function to check if a specific role exists in any of the user's role fields
 */
function hasSpecificRole(user: any, roleToCheck: string): boolean {
  const roleLower = roleToCheck.toLowerCase();

  console.log(`[hasSpecificRole] Checking for role: ${roleToCheck}`);
  console.log(`[hasSpecificRole] User object:`, user);

  // Check in role_front
  if (
    Array.isArray(user.role_front) &&
    user.role_front.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in role_front array`);
    return true;
  }
  if (
    typeof user.role_front === "string" &&
    user.role_front.toLowerCase() === roleLower
  ) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in role_front string`);
    return true;
  }

  // Check in role_system
  if (
    Array.isArray(user.role_system) &&
    user.role_system.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in role_system array`);
    return true;
  }
  if (
    typeof user.role_system === "string" &&
    user.role_system.toLowerCase() === roleLower
  ) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in role_system string`);
    return true;
  }

  // Check in legacy role
  if (
    Array.isArray(user.role) &&
    user.role.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in legacy role array`);
    return true;
  }
  if (typeof user.role === "string" && user.role.toLowerCase() === roleLower) {
    console.log(`[hasSpecificRole] Found ${roleToCheck} in legacy role string`);
    return true;
  }

  console.log(`[hasSpecificRole] Role ${roleToCheck} not found in any field`);
  return false;
}

/**
 * Check if the user has the required frontend role
 * @param {RoleFront[]} requiredRoles - Array of roles that are allowed
 * @returns {boolean} Whether user has one of the required roles
 */
export function hasRequiredRole(requiredRoles: RoleFront[]): boolean {
  const userRole = getUserFrontendRole();
  if (!userRole) return false;

  return requiredRoles.map((role) => role.toLowerCase()).includes(userRole);
}

/**
 * Get dashboard path based on user's role
 * @returns {string} The dashboard path
 */
export function getUserDashboardPath(): string {
  const role = getUserFrontendRole();

  console.log("[getUserDashboardPath] User role:", role);

  switch (role) {
    case "admin":
      return "/dashboard/manager"; // Admin uses manager dashboard
    case "manager":
      return "/dashboard/manager";
    case "staff":
      return "/dashboard/staff"; // Staff has their own dashboard with permissions
    case "instructor":
      return "/dashboard/manager"; // Instructor uses manager dashboard
    case "student":
      return "/dashboard/manager"; // Student uses manager dashboard
    default:
      return "/";
  }
}
