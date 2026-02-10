"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

/**
 * Navbar - Main navigation component
 *
 * Features:
 * - Sticky header with blur backdrop
 * - Responsive design (desktop vs mobile)
 * - Auth-aware navigation links
 * - User menu for authenticated users
 * - Login/Register buttons for guests
 * - Mobile hamburger menu
 * - Accessible navigation structure
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <Navbar />
 * ```
 */
export function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-xl font-bold tracking-tight"
          aria-label="L'Artisan Baking Atelier Home"
        >
          <span className="text-primary">L&apos;Artisan</span>
          <span className="hidden sm:inline">Baking Atelier</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks
            className="flex"
            activeClassName="text-foreground font-medium"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  );
}
