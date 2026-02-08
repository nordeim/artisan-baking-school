"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

/**
 * Password strength requirements
 */
interface PasswordStrength {
  score: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  return { score, requirements };
}

/**
 * Registration form validation schema
 */
const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * RegisterForm props
 */
interface RegisterFormProps {
  /** Callback fired on successful registration */
  onSuccess?: () => void;
  /** Additional className for styling */
  className?: string;
}

/**
 * RegisterForm - User registration form
 *
 * Features:
 * - Name, email, password, confirmPassword validation with Zod
 * - Password strength indicator
 * - Password visibility toggles for both fields
 * - Loading states with spinner
 * - Error handling with Alert component
 * - Links to login page
 * - Accessible labels and focus management
 *
 * @example
 * ```tsx
 * <RegisterForm onSuccess={() => router.push("/dashboard")} />
 * ```
 */
export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  // Watch fields for error clearing and password strength
  const name = watch("name");
  const email = watch("email");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Track previous values to detect actual changes
  const [prevName, setPrevName] = useState("");
  const [prevEmail, setPrevEmail] = useState("");
  const [prevPassword, setPrevPassword] = useState("");
  const [prevConfirmPassword, setPrevConfirmPassword] = useState("");

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password || ""));
  }, [password]);

  // Clear error when user types (only when values actually change)
  useEffect(() => {
    const nameChanged = name !== prevName;
    const emailChanged = email !== prevEmail;
    const passwordChanged = password !== prevPassword;
    const confirmChanged = confirmPassword !== prevConfirmPassword;

    if (
      error &&
      (nameChanged || emailChanged || passwordChanged || confirmChanged)
    ) {
      setError(null);
    }

    setPrevName(name || "");
    setPrevEmail(email || "");
    setPrevPassword(password || "");
    setPrevConfirmPassword(confirmPassword || "");
  }, [name, email, password, confirmPassword, error]);

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      setError(null);

      try {
        const result = await registerUser({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        });

        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Registration failed");
        }
      } catch {
        setError("An error occurred during registration");
      }
    },
    [registerUser, onSuccess],
  );

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const getStrengthLabel = (score: number): string => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  const getStrengthColor = (score: number): string => {
    if (score === 0) return "bg-muted";
    if (score <= 2) return "bg-destructive";
    if (score <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className={`w-full max-w-md mx-auto space-y-6 ${className || ""}`}>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            autoComplete="name"
            autoFocus
            disabled={isLoading}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : "password-requirements"
              }
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}

          {/* Password Strength Indicator */}
          <div id="password-requirements" className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Password strength
              </span>
              <span
                className={`text-xs font-medium ${
                  passwordStrength.score === 0
                    ? "text-muted-foreground"
                    : passwordStrength.score <= 2
                      ? "text-destructive"
                      : passwordStrength.score <= 4
                        ? "text-yellow-500"
                        : "text-green-500"
                }`}
              >
                {getStrengthLabel(passwordStrength.score)}
              </span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li
                className={`flex items-center gap-1 ${passwordStrength.requirements.length ? "text-green-600" : ""}`}
              >
                {passwordStrength.requirements.length ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                At least 8 characters
              </li>
              <li
                className={`flex items-center gap-1 ${passwordStrength.requirements.uppercase ? "text-green-600" : ""}`}
              >
                {passwordStrength.requirements.uppercase ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                Uppercase letter
              </li>
              <li
                className={`flex items-center gap-1 ${passwordStrength.requirements.number ? "text-green-600" : ""}`}
              >
                {passwordStrength.requirements.number ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                Add a number
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-error" : undefined
              }
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-error" className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
