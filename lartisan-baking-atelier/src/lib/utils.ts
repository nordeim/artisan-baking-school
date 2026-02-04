import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names with Tailwind merge support
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 *
 * @example
 * cn('px-2', 'px-4') // returns 'px-4'
 * cn('bg-red-500', isActive && 'bg-blue-500') // conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Singapore Dollar (SGD) currency
 *
 * @param amount - The amount to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(100) // '$100.00'
 * formatCurrency(55.5) // '$55.50'
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Calculates Singapore GST (9%) on a given amount
 * GST is rounded to 2 decimal places
 *
 * @param amount - The subtotal amount (before GST)
 * @returns The GST amount (9% of subtotal)
 *
 * @example
 * calculateGST(100) // 9.00
 * calculateGST(55.5) // 5.00
 * calculateGST(33.33) // 3.00
 */
export function calculateGST(amount: number): number {
  const gst = amount * 0.09;
  // Round to 2 decimal places
  return Math.round(gst * 100) / 100;
}

/**
 * Calculates total with GST included
 *
 * @param subtotal - Amount before GST
 * @returns Object with subtotal, gst, and total
 *
 * @example
 * calculateTotalWithGST(100) // { subtotal: 100, gst: 9, total: 109 }
 */
export function calculateTotalWithGST(subtotal: number): {
  subtotal: number;
  gst: number;
  total: number;
} {
  const gst = calculateGST(subtotal);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst,
    total: Math.round((subtotal + gst) * 100) / 100,
  };
}

/**
 * Generates a unique order number
 * Format: ORD-{timestamp}-{random}
 *
 * @returns Unique order number string
 *
 * @example
 * generateOrderNumber() // 'ORD-1704067200000-ABC123'
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Formats a date with various presets or custom options
 * Uses date-fns style formatting internally
 *
 * @param date - Date to format
 * @param format - Format preset or custom format string
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date(), 'short') // 'Jan 1, 2024'
 * formatDate(new Date(), 'long') // 'Monday, January 1, 2024'
 * formatDate(new Date(), 'iso') // '2024-01-01'
 */
export function formatDate(
  date: Date | string | number,
  format: "short" | "medium" | "long" | "iso" | "relative" = "medium",
): string {
  const d = new Date(date);

  switch (format) {
    case "short":
      return d.toLocaleDateString("en-SG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "medium":
      return d.toLocaleDateString("en-SG", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return d.toLocaleDateString("en-SG", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "iso":
      return d.toISOString().split("T")[0];
    case "relative":
      return getRelativeTimeString(d);
    default:
      return d.toLocaleDateString("en-SG");
  }
}

/**
 * Gets relative time string (e.g., "2 days ago")
 *
 * @param date - Date to compare
 * @returns Relative time string
 */
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSecs < 60) return "Just now";
  if (diffInMins < 60)
    return `${diffInMins} minute${diffInMins > 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  if (diffInWeeks < 4)
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

/**
 * Validates an email address format
 *
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Slugifies a string for URLs
 * Converts to lowercase, removes special chars, replaces spaces with hyphens
 *
 * @param str - String to slugify
 * @returns URL-safe slug
 *
 * @example
 * slugify('Sourdough Mastery Course') // 'sourdough-mastery-course'
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncates text to a specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalizes the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case
 *
 * @param str - String to convert
 * @returns Title case string
 *
 * @example
 * toTitleCase('sourdough mastery') // 'Sourdough Mastery'
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Deep clones an object using JSON serialization
 * Note: Does not handle functions, Dates, or circular references
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounces a function call
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttles a function call
 *
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Gets initials from a name (first letter of first and last name)
 *
 * @param name - Full name
 * @returns Initials (max 2 characters)
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Sarah Mitchell') // 'SM'
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format bytes to human readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string
 *
 * @example
 * formatBytes(1024) // '1 KB'
 * formatBytes(1234567) // '1.18 MB'
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
