import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  VALIDATION_ERROR: "Validation failed",
  SERVER_ERROR: "An unexpected error occurred",
} as const;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: "Invalid JSON" },
        { status: 400 },
      );
    }

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: flattenedErrors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password } = validationResult.data;

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, return generic error (prevent email enumeration)
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      user.passwordHash || "",
    );

    // If password is wrong, return same generic error
    if (!isValidPassword) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    // Create session
    const session = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Build sanitized user response (exclude password hash)
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };

    // Create response with cookies
    const response = NextResponse.json(
      {
        user: sanitizedUser,
        message: "Login successful",
      },
      { status: 200 },
    );

    // Set authentication cookies
    response.cookies.set("auth-token", session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    response.cookies.set("refresh-token", session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/api/auth/refresh",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
