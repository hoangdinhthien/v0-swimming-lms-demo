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

  // Check for staff role first
  if (hasSpecificRole(user, "staff")) {
    return "staff";
  }

  // Check for manager role
  if (hasSpecificRole(user, "manager")) {
    return "manager";
  }

  // Check for other roles
  if (hasSpecificRole(user, "admin")) {
    return "admin";
  }

  if (hasSpecificRole(user, "instructor")) {
    return "instructor";
  }

  if (hasSpecificRole(user, "student")) {
    return "student";
  }

  return "manager"; // Default fallback
}

/**
 * Helper function to check if a specific role exists in any of the user's role fields
 */
function hasSpecificRole(user: any, roleToCheck: string): boolean {
  const roleLower = roleToCheck.toLowerCase();

  // Check in role_front
  if (
    Array.isArray(user.role_front) &&
    user.role_front.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    return true;
  }
  if (
    typeof user.role_front === "string" &&
    user.role_front.toLowerCase() === roleLower
  ) {
    return true;
  }

  // Check in role_system
  if (
    Array.isArray(user.role_system) &&
    user.role_system.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    return true;
  }
  if (
    typeof user.role_system === "string" &&
    user.role_system.toLowerCase() === roleLower
  ) {
    return true;
  }

  // Check in legacy role
  if (
    Array.isArray(user.role) &&
    user.role.some((r: string) => r.toLowerCase() === roleLower)
  ) {
    return true;
  }
  if (typeof user.role === "string" && user.role.toLowerCase() === roleLower) {
    return true;
  }

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

  switch (role) {
    case "admin":
      return "/dashboard/manager"; // Admin uses manager dashboard
    case "manager":
      return "/dashboard/manager";
    case "staff":
      return "/dashboard/manager"; // Staff now use manager dashboard (permissions still applied)
    case "instructor":
      return "/dashboard/manager"; // Instructor uses manager dashboard
    case "student":
      return "/dashboard/manager"; // Student uses manager dashboard
    default:
      return "/";
  }
}
