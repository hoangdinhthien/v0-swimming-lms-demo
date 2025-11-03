/**
 * Utility functions for date and time formatting
 * Version 1.0.2 - Enhanced with better timezone handling, error management, and WebSocket compatibility
 */

/**
 * Format a timestamp (Date, string or number) into a user-friendly string
 * based on when the message was sent (today, yesterday, or older)
 *
 * @param timestamp - The timestamp to format (Date object, ISO string, or epoch milliseconds)
 * @returns Formatted time string (e.g. "12:34", "Yesterday, 12:34", or "01/01/2025, 12:34")
 */
/**
 * Standardizes a timestamp input to ensure consistent handling
 * Handles both ISO strings from API and numeric timestamps from WebSockets
 *
 * @param timestamp - The timestamp to standardize
 * @returns A Date object
 */
export function standardizeTimestamp(timestamp: string | number | Date): Date {
  if (!timestamp) {
    return new Date(); // Default to current time if no timestamp
  }

  try {
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a numeric timestamp (milliseconds since epoch)
    if (typeof timestamp === "number") {
      return new Date(timestamp);
    }

    // If it's a string (ISO format or other string format)
    return new Date(timestamp);
  } catch (error) {
    console.error("Error standardizing timestamp:", error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Format a timestamp (Date, string or number) to show the UTC time directly
 * without converting to local timezone. Used for displaying UTC timestamps as they are.
 *
 * @param timestamp - The timestamp to format (Date object, ISO string, or epoch milliseconds)
 * @returns Formatted time string showing UTC time (e.g. "21:08 12/06/2025")
 */
export function formatUtcDate(timestamp: string | number | Date): string {
  if (!timestamp) return "";

  try {
    // Convert input to Date object using our standardization function
    const messageDate = standardizeTimestamp(timestamp);

    // Handle invalid dates
    if (isNaN(messageDate.getTime())) {
      console.error("Invalid date input:", timestamp);
      return String(timestamp);
    }

    // Format using UTC methods instead of locale methods with timezone
    const hours = messageDate.getUTCHours().toString().padStart(2, "0");
    const minutes = messageDate.getUTCMinutes().toString().padStart(2, "0");
    const day = messageDate.getUTCDate().toString().padStart(2, "0");
    const month = (messageDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = messageDate.getUTCFullYear();

    // Return in format "HH:MM DD/MM/YYYY"
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting UTC date:", error);
    return String(timestamp);
  }
}

/**
 * Format a timestamp (Date, string or number) into a user-friendly string
 * based on when the message was sent (today, yesterday, or older)
 *
 * @param timestamp - The timestamp to format (Date object, ISO string, or epoch milliseconds)
 * @returns Formatted time string (e.g. "12:34", "Yesterday, 12:34", or "01/01/2025, 12:34")
 */
export function formatMessageTime(timestamp: string | number | Date): string {
  if (!timestamp) return "";

  try {
    // Convert input to Date object using our standardization function
    const messageDate = standardizeTimestamp(timestamp);

    // Handle invalid dates
    if (isNaN(messageDate.getTime())) {
      console.error("Invalid date input:", timestamp);
      return String(timestamp);
    }

    // Always use Vietnam timezone for display
    const timeZone = "Asia/Ho_Chi_Minh";
    const locale = "vi-VN";

    // Create a date object for today at midnight in Vietnam time
    const now = new Date();
    const today = new Date(now.toLocaleString(locale, { timeZone }));
    today.setHours(0, 0, 0, 0);

    // Create a date object for yesterday at midnight in Vietnam time
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create a date object for the message date at midnight in Vietnam time
    const messageDay = new Date(
      messageDate.toLocaleString(locale, { timeZone })
    );
    messageDay.setHours(0, 0, 0, 0);

    // Format time based on when the message was sent
    if (messageDay.getTime() === today.getTime()) {
      // Today: show only time
      return messageDate.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      });
    } else if (messageDay.getTime() === yesterday.getTime()) {
      // Yesterday: show "Yesterday, [time]"
      return `Hôm qua, ${messageDate.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      })}`;
    } else {
      // Older: show date and time
      return messageDate.toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      });
    }
  } catch (error) {
    console.error("Error formatting message time:", error);
    return String(timestamp);
  }
}

/**
 * Format a timestamp to Vietnam time (UTC+7)
 * This is used specifically in the datetime-demo and kept for reference
 *
 * @param timestamp - The timestamp to format (Date object, ISO string, or epoch milliseconds)
 * @param showSeconds - Whether to include seconds in the formatted time
 * @returns Formatted time string in Vietnam timezone (e.g. "04:08 13/06/2025")
 */
export function formatVietnamDate(
  timestamp: string | number | Date,
  showSeconds: boolean = false
): string {
  if (!timestamp) return "";

  try {
    // Convert input to Date object using our standardization function
    const messageDate = standardizeTimestamp(timestamp);

    // Handle invalid dates
    if (isNaN(messageDate.getTime())) {
      console.error("Invalid date input:", timestamp);
      return String(timestamp);
    }

    // Format using Vietnam timezone (UTC+7)
    const timeZone = "Asia/Ho_Chi_Minh";
    const locale = "vi-VN";

    // Format options
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    };

    // Add seconds if requested
    if (showSeconds) {
      options.second = "2-digit";
    }

    // Return formatted date
    return messageDate.toLocaleString(locale, options);
  } catch (error) {
    console.error("Error formatting Vietnam date:", error);
    return String(timestamp);
  }
}

/**
 * Log detailed information about a timestamp for debugging purposes
 *
 * @param label - A label to identify the log
 * @param timestamp - The timestamp to log information about
 */
/**
 * Log detailed information about a timestamp for debugging purposes
 *
 * @param label - A label to identify the log
 * @param timestamp - The timestamp to log information about
 * @param showFormatted - Whether to show the formatted output using formatMessageTime
 */
export function logTimestampDebugInfo(
  label: string,
  timestamp: any,
  showFormatted: boolean = true
): void {
  try {
    const date = new Date(timestamp);
    console.group(`Timestamp Debug: ${label}`);
    console.log(`- Original value: ${timestamp}`);
    console.log(`- Type: ${typeof timestamp}`);

    if (!isNaN(date.getTime())) {
      console.log(`- Parsed local date: ${date.toString()}`);
      console.log(`- ISO string: ${date.toISOString()}`);
      console.log(`- Locale string: ${date.toLocaleString()}`);
      console.log(`- UTC string: ${date.toUTCString()}`);
      console.log(`- Timezone offset: ${date.getTimezoneOffset()} minutes`);
      console.log(
        `- Browser timezone: ${
          Intl.DateTimeFormat().resolvedOptions().timeZone
        }`
      );
      console.log(`- Time components:`, {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
      });

      if (showFormatted) {
        console.log(
          `- Formatted with formatMessageTime: ${formatMessageTime(date)}`
        );
      }
    } else {
      console.warn(`- Invalid date value`);
    }
    console.groupEnd();
  } catch (error) {
    console.error("Error logging timestamp debug info:", error);
  }
}

/**
 * Convert backend day number to Vietnamese day name
 * Backend API uses: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
 *
 * @param dayNumber - Backend day number (0-6)
 * @returns Vietnamese day name (e.g. "Thứ 2", "Chủ nhật")
 */
export function getVietnameseDayName(dayNumber: number): string {
  const dayNames = [
    "Thứ 2", // 0 = Monday
    "Thứ 3", // 1 = Tuesday
    "Thứ 4", // 2 = Wednesday
    "Thứ 5", // 3 = Thursday
    "Thứ 6", // 4 = Friday
    "Thứ 7", // 5 = Saturday
    "Chủ nhật", // 6 = Sunday
  ];

  if (dayNumber < 0 || dayNumber > 6) {
    console.warn(`Invalid day number: ${dayNumber}`);
    return "Không xác định";
  }

  return dayNames[dayNumber];
}

/**
 * Get day of week from a date string and convert to Vietnamese day name
 * Uses backend API day mapping and UTC time to avoid timezone issues
 *
 * @param dateString - ISO date string (e.g. "2025-11-03T17:44:12.000Z")
 * @returns Vietnamese day name
 */
export function getVietnameseDayFromDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const jsDay = date.getUTCDay(); // Use UTC to avoid timezone issues! 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

    // Convert JS UTC day to backend API day mapping
    // JS UTC:  0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // API:     0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    const apiDay =
      jsDay === 0
        ? 6 // Sunday -> 6
        : jsDay - 1; // Mon-Sat -> 0-5

    return getVietnameseDayName(apiDay);
  } catch (error) {
    console.error("Error getting Vietnamese day from date:", error);
    return "Không xác định";
  }
}
