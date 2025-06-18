import { redirect } from "next/navigation";
import Cookies from "js-cookie";

// Set cookie expiry to 1 day for more frequent authentication
const COOKIE_EXPIRY_DAYS = 1;

// Session check interval (in milliseconds) - check every 30 seconds
const SESSION_CHECK_INTERVAL = 30 * 1000;

// Warning time before token expires (in seconds) - warn 5 minutes before expiry
const TOKEN_WARNING_TIME = 5 * 60;

let sessionCheckInterval: NodeJS.Timeout | null = null;
let warningShown = false;

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

    // Start session monitoring after successful login
    startSessionMonitoring();
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    // Stop session monitoring
    stopSessionMonitoring();

    // Clear authentication cookies
    Cookies.remove("token");
    Cookies.remove("user");

    // Also clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Reset warning flag
    warningShown = false;

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

export function getTokenExpiryTime(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded.exp || null;
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  // Ensure we're on the client side and properly hydrated
  if (typeof window === "undefined") return false;

  // Add a small delay to ensure DOM is ready
  try {
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
  } catch (error) {
    // Handle any potential errors during hydration
    console.warn("Authentication check failed during hydration:", error);
    return false;
  }
}

export function startSessionMonitoring() {
  if (typeof window === "undefined") return;

  // Clear any existing interval
  stopSessionMonitoring();

  sessionCheckInterval = setInterval(() => {
    const token = getAuthToken();

    if (!token) {
      console.log("No token found - redirecting to login");
      logout();
      return;
    }

    if (isTokenExpired(token)) {
      console.log("Token expired - redirecting to login");
      logout();
      return;
    }

    // Check if token is about to expire and show warning
    const expiryTime = getTokenExpiryTime(token);
    if (expiryTime) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiryTime - now;

      if (timeUntilExpiry <= TOKEN_WARNING_TIME && !warningShown) {
        warningShown = true;
        const minutes = Math.floor(timeUntilExpiry / 60);
        if (minutes > 0) {
          alert(
            `Your session will expire in ${minutes} minute(s). Please save your work.`
          );
        } else {
          alert("Your session is about to expire. Please save your work.");
        }
      }
    }
  }, SESSION_CHECK_INTERVAL);
}

export function stopSessionMonitoring() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  warningShown = false;
}

// Function to check session on page load/focus
export function checkSessionOnPageLoad() {
  if (typeof window === "undefined") return;

  // Wait for next tick to ensure hydration is complete
  setTimeout(() => {
    // Check authentication immediately
    if (!isAuthenticated()) {
      return;
    }

    // Start monitoring
    startSessionMonitoring();

    // Add event listeners for page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Page became visible, check session immediately
        if (!isAuthenticated()) {
          return;
        }
      }
    });

    // Add event listener for window focus
    window.addEventListener("focus", () => {
      if (!isAuthenticated()) {
        return;
      }
    });
  }, 0);
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

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // Try to get token from cookie first
    const tokenCookie = Cookies.get("token");
    if (tokenCookie) return tokenCookie;

    // Fallback to localStorage
    return localStorage.getItem("token");
  }
  return null;
}
