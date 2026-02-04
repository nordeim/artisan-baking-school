import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  formatCurrency,
  calculateGST,
  calculateTotalWithGST,
  generateOrderNumber,
  formatDate,
  isValidEmail,
  slugify,
  truncate,
  capitalize,
  toTitleCase,
  deepClone,
  debounce,
  throttle,
  getInitials,
  formatBytes,
} from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active",
    );
  });

  it("should merge tailwind classes (last one wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("should handle array syntax from clsx", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
    expect(cn("base", ["mod1", "mod2"])).toBe("base mod1 mod2");
  });

  it("should handle object syntax from clsx", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
    expect(cn("base", { active: true })).toBe("base active");
  });

  it("should filter out falsy values", () => {
    expect(cn("class1", null, undefined, false, "", "class2")).toBe(
      "class1 class2",
    );
  });
});

describe("formatCurrency", () => {
  it("should format SGD currency correctly", () => {
    // Note: Intl.NumberFormat for en-SG outputs "$" prefix not "S$" in Node.js
    expect(formatCurrency(100)).toMatch(/\$100\.00/);
    expect(formatCurrency(55.5)).toMatch(/\$55\.50/);
    expect(formatCurrency(0)).toMatch(/\$0\.00/);
  });

  it("should handle decimal places correctly", () => {
    expect(formatCurrency(100.999)).toMatch(/\$101\.00/);
    expect(formatCurrency(100.001)).toMatch(/\$100\.00/);
  });

  it("should accept custom options", () => {
    expect(formatCurrency(1000, { notation: "compact" })).toMatch(/\$1/);
  });
});

describe("calculateGST", () => {
  it("should calculate 9% GST correctly", () => {
    expect(calculateGST(100)).toBe(9);
    expect(calculateGST(200)).toBe(18);
    expect(calculateGST(0)).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateGST(55.5)).toBe(5);
    expect(calculateGST(33.33)).toBe(3);
    expect(calculateGST(12.345)).toBe(1.11);
  });

  it("should handle edge cases", () => {
    expect(calculateGST(0.01)).toBe(0);
    expect(calculateGST(9999.99)).toBe(900);
  });
});

describe("calculateTotalWithGST", () => {
  it("should calculate subtotal, GST, and total correctly", () => {
    const result = calculateTotalWithGST(100);
    expect(result.subtotal).toBe(100);
    expect(result.gst).toBe(9);
    expect(result.total).toBe(109);
  });

  it("should handle decimal amounts", () => {
    const result = calculateTotalWithGST(55.55);
    expect(result.subtotal).toBe(55.55);
    expect(result.gst).toBe(5);
    expect(result.total).toBe(60.55);
  });

  it("should round all values to 2 decimal places", () => {
    const result = calculateTotalWithGST(33.333);
    expect(result.subtotal).toBe(33.33);
  });
});

describe("generateOrderNumber", () => {
  it("should generate a string starting with ORD-", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber.startsWith("ORD-")).toBe(true);
  });

  it("should generate unique order numbers", () => {
    const order1 = generateOrderNumber();
    const order2 = generateOrderNumber();
    expect(order1).not.toBe(order2);
  });

  it("should include timestamp and random suffix", () => {
    const orderNumber = generateOrderNumber();
    const parts = orderNumber.split("-");
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("ORD");
    expect(Number(parts[1])).not.toBeNaN(); // timestamp
    expect(parts[2].length).toBe(6); // random suffix
  });
});

describe("formatDate", () => {
  const testDate = new Date("2024-01-15T10:30:00");

  it("should format short date correctly", () => {
    // en-SG locale format: "15 Jan 2024"
    const result = formatDate(testDate, "short");
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
  });

  it("should format medium date correctly", () => {
    const result = formatDate(testDate, "medium");
    expect(result).toContain("January");
    expect(result).toContain("2024");
  });

  it("should format long date correctly", () => {
    const result = formatDate(testDate, "long");
    expect(result).toContain("Monday");
    expect(result).toContain("January");
    expect(result).toContain("2024");
  });

  it("should format ISO date correctly", () => {
    expect(formatDate(testDate, "iso")).toBe("2024-01-15");
  });

  it("should accept string dates", () => {
    const result = formatDate("2024-01-15", "short");
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
  });

  it("should accept timestamp", () => {
    const result = formatDate(testDate.getTime(), "short");
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
  });
});

describe("isValidEmail", () => {
  it("should return true for valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("should return false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("test")).toBe(false);
    expect(isValidEmail("test@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("test@example")).toBe(false);
    expect(isValidEmail("test example.com")).toBe(false);
  });
});

describe("slugify", () => {
  it("should convert to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("should trim leading/trailing hyphens", () => {
    expect(slugify("-hello world-")).toBe("hello-world");
  });

  it("should handle real course titles", () => {
    expect(slugify("Sourdough Mastery")).toBe("sourdough-mastery");
    expect(slugify("Viennoiserie Artistry")).toBe("viennoiserie-artistry");
  });
});

describe("truncate", () => {
  it("should truncate long text", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });

  it("should not truncate short text", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("should handle exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("capitalize", () => {
  it("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("HELLO")).toBe("HELLO");
  });

  it("should handle empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("should handle single character", () => {
    expect(capitalize("h")).toBe("H");
  });
});

describe("toTitleCase", () => {
  it("should convert to title case", () => {
    expect(toTitleCase("hello world")).toBe("Hello World");
    expect(toTitleCase("SOURDOUGH MASTERY")).toBe("Sourdough Mastery");
  });

  it("should handle single word", () => {
    expect(toTitleCase("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(toTitleCase("")).toBe("");
  });
});

describe("deepClone", () => {
  it("should clone primitive values", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("test")).toBe("test");
  });

  it("should clone objects", () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it("should clone arrays", () => {
    const arr = [1, 2, { a: 3 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay function execution", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should reset timer on subsequent calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should limit function execution", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("getInitials", () => {
  it("should get initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Sarah Mitchell")).toBe("SM");
  });

  it("should handle single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should handle multiple names", () => {
    expect(getInitials("John Jacob Jingleheimer Schmidt")).toBe("JS");
  });

  it("should trim whitespace", () => {
    expect(getInitials("  John Doe  ")).toBe("JD");
  });
});

describe("formatBytes", () => {
  it("should format bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("should handle decimal places", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1234567, 2)).toBe("1.18 MB");
  });

  it("should handle custom decimal places", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
  });
});
