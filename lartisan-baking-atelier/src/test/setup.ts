import "@testing-library/jest-dom";
import { vi } from "vitest";

// Polyfill TextEncoder/TextDecoder for jsdom (required by jose library)
import { TextEncoder, TextDecoder } from "util";
Object.assign(global, { TextEncoder, TextDecoder });

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));

// Extend matchers
declare module "vitest" {
  interface Assertion {
    toBeInTheDocument(): void;
    toHaveClass(className: string): void;
    toHaveTextContent(text: string | RegExp): void;
    toBeVisible(): void;
  }
}
