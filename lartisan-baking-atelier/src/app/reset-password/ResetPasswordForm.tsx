"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/useToast";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { error: showError, success: showSuccess } = useToast();

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsTokenValid(true);
        }
      } catch (err) {
        console.error("Token validation error:", err);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
      showSuccess("Password reset successful!");
    } catch (err) {
      showError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-champagne" />
          <p className="text-slate-400">Validating reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-serif text-slate-100 mb-4">
            Invalid or Expired Link
          </h1>
          <p className="text-slate-400 mb-8">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Request New Link
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-serif text-slate-100 mb-4">
            Password Reset Successful
          </h1>
          <p className="text-slate-400 mb-8">
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <Link href="/login">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-slate-100 mb-2">
            Reset Password
          </h1>
          <p className="text-slate-400">Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-600"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-colors ${
                        level <= passwordStrength
                          ? getStrengthColor()
                          : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Strength:{" "}
                  <span
                    className={
                      passwordStrength <= 2
                        ? "text-red-400"
                        : passwordStrength <= 3
                          ? "text-yellow-400"
                          : "text-green-400"
                    }
                  >
                    {getStrengthText()}
                  </span>
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="text-xs text-slate-500 space-y-1 mt-2">
              <p className={password.length >= 8 ? "text-green-400" : ""}>
                ✓ At least 8 characters
              </p>
              <p className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                ✓ One uppercase letter
              </p>
              <p className={/[a-z]/.test(password) ? "text-green-400" : ""}>
                ✓ One lowercase letter
              </p>
              <p className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                ✓ One number
              </p>
              <p
                className={
                  /[^A-Za-z0-9]/.test(password) ? "text-green-400" : ""
                }
              >
                ✓ One special character
              </p>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-10 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-600 ${
                  confirmPassword && password !== confirmPassword
                    ? "border-red-500"
                    : ""
                }`}
                disabled={isLoading}
                required
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={
              isLoading || password !== confirmPassword || password.length < 8
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Reset Password
              </>
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-champagne hover:underline text-sm inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
