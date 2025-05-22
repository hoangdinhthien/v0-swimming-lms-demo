import { redirect } from "next/navigation";
import Cookies from "js-cookie";

// Set cookie expiry to 7 days by default
const COOKIE_EXPIRY_DAYS = 7;

export function setAuthCookies(token: string, user: any) {
  // Store the token in a cookie
  Cookies.set("token", token, {
    expires: COOKIE_EXPIRY_DAYS,
    sameSite: "strict",
  });

  // Store user data in a cookie
  Cookies.set("user", JSON.stringify(user), {
    expires: COOKIE_EXPIRY_DAYS,
    sameSite: "strict",
  });

  // Also keep in localStorage for client-side access
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    // Clear authentication cookies
    Cookies.remove("token");
    Cookies.remove("user");

    // Also clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Any other cleanup needed

    // Return to login page
    window.location.href = "/login";
  }
}

export function isAuthenticated() {
  if (typeof window !== "undefined") {
    // Check cookies first, then localStorage as fallback
    const tokenCookie = Cookies.get("token");
    const tokenLocal = localStorage.getItem("token");
    return !!(tokenCookie || tokenLocal);
  }
  return false;
}

export function getAuthenticatedUser() {
  if (typeof window !== "undefined") {
    // Try to get user from cookie first
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        return JSON.parse(userCookie);
      } catch (e) {
        console.error("Failed to parse user data from cookie", e);
      }
    }

    // Fallback to localStorage
    const userLocal = localStorage.getItem("user");
    if (userLocal) {
      try {
        return JSON.parse(userLocal);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }
  }
  return null;
}
