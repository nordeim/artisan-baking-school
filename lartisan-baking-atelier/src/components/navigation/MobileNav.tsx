"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth, type User } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Shield,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation link item structure
 */
interface NavLink {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiredRole?: "USER" | "ADMIN";
  icon?: React.ReactNode;
}

/**
 * Navigation links configuration for mobile
 */
const navLinks: NavLink[] = [
  { href: "/", label: "Home", icon: <UserIcon className="h-4 w-4" /> },
  {
    href: "/dashboard",
    label: "Dashboard",
    requiresAuth: true,
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/profile",
    label: "Profile",
    requiresAuth: true,
    icon: <UserIcon className="h-4 w-4" />,
  },
  {
    href: "/admin",
    label: "Admin",
    requiresAuth: true,
    requiredRole: "ADMIN",
    icon: <Shield className="h-4 w-4" />,
  },
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
    if (!link.requiresAuth) return true;
    if (!isAuthenticated) return false;
    if (link.requiredRole && user?.role !== link.requiredRole) {
      return false;
    }
    return true;
  });
}

/**
 * Generate avatar initials from user name
 */
function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * MobileNav - Mobile navigation drawer
 *
 * Features:
 * - Hamburger menu trigger (hidden on desktop)
 * - Right-side slide-in drawer
 * - Conditional links based on auth state
 * - User profile section for authenticated users
 * - Quick logout action
 * - Accessible navigation
 *
 * @example
 * ```tsx
 * // In Navbar
 * <MobileNav />
 * ```
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const visibleLinks = filterNavLinks(navLinks, isAuthenticated, user);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">Navigation</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* User Profile Section (for authenticated users) */}
            {user && (
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    {user.role === "ADMIN" && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 px-2 py-4">
              <ul className="space-y-1">
                {visibleLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);

                  return (
                    <li key={link.href}>
                      <SheetClose asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {link.icon}
                          {link.label}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t mt-auto">
              {isAuthenticated ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <div className="space-y-2">
                  <SheetClose asChild>
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/register" className="w-full">
                      <Button className="w-full">Register</Button>
                    </Link>
                  </SheetClose>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
