import { redirect } from "next/navigation";
import Cookies from "js-cookie";

// Set cookie expiry to 1 day for more frequent authentication
const COOKIE_EXPIRY_DAYS = 1;

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

// App version timestamp - change this on significant updates to force re-authentication
const APP_VERSION_TIMESTAMP = "2025-05-30";

export function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (!decoded.exp) return true;

    // exp is in seconds since epoch
    const now = Math.floor(Date.now() / 1000);

    // Check token timestamp against app version
    if (
      decoded.iat &&
      new Date(decoded.iat * 1000).toISOString().slice(0, 10) <
        APP_VERSION_TIMESTAMP
    ) {
      console.log(
        "Token was issued before the current app version - forcing refresh"
      );
      return true;
    }

    return decoded.exp < now;
  } catch (e) {
    console.error("Error checking token expiration:", e);
    return true;
  }
}

export function isAuthenticated() {
  if (typeof window !== "undefined") {
    // Check cookies first, then localStorage as fallback
    const tokenCookie = Cookies.get("token");
    const tokenLocal = localStorage.getItem("token");
    const token = tokenCookie || tokenLocal;
    if (!token) return false;
    if (isTokenExpired(token)) {
      logout();
      return false;
    }
    return true;
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
