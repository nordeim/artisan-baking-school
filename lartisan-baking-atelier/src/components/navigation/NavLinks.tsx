"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import type { User } from "@/components/providers/AuthProvider";

/**
 * Navigation link item structure
 */
interface NavLink {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiredRole?: "USER" | "ADMIN";
}

/**
 * Navigation links configuration
 */
const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard", requiresAuth: true },
  { href: "/profile", label: "Profile", requiresAuth: true },
  { href: "/admin", label: "Admin", requiresAuth: true, requiredRole: "ADMIN" },
];

/**
 * Filter links based on authentication state and user role
 */
function filterNavLinks(
  links: NavLink[],
  isAuthenticated: boolean,
  user: User | null,
): NavLink[] {
  return links.filter((link) => {
    // Show public links to everyone
    if (!link.requiresAuth) return true;

    // Hide auth-required links from guests
    if (!isAuthenticated) return false;

    // Check role requirements
    if (link.requiredRole && user?.role !== link.requiredRole) {
      return false;
    }

    return true;
  });
}

/**
 * NavLinksProps - Component props
 */
interface NavLinksProps {
  className?: string;
  linkClassName?: string;
  activeClassName?: string;
  onLinkClick?: () => void;
}

/**
 * NavLinks - Desktop navigation links
 *
 * Features:
 * - Conditional rendering based on auth state
 * - Role-based access (Admin only for /admin)
 * - Active state styling
 * - Accessible navigation
 *
 * @example
 * ```tsx
 * // In Navbar
 * <NavLinks
 *   className="hidden md:flex items-center gap-6"
 *   activeClassName="text-foreground font-medium"
 * />
 * ```
 */
export function NavLinks({
  className,
  linkClassName,
  activeClassName = "text-foreground font-medium",
  onLinkClick,
}: NavLinksProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const visibleLinks = filterNavLinks(navLinks, isAuthenticated, user);

  return (
    <nav className={className} aria-label="Main navigation">
      <ul className="flex items-center gap-6">
        {visibleLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-sm transition-colors hover:text-foreground/80",
                  isActive ? activeClassName : "text-foreground/60",
                  linkClassName,
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={onLinkClick}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
