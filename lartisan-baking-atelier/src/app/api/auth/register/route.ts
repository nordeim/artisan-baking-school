import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

/**
 * POST /api/auth/register
 * Handles user registration with validation, password hashing, and session creation
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();

      return NextResponse.json(
        {
          error: "Validation failed",
          details: flattenedErrors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, password, pdpaConsent, marketingConsent } =
      validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email already registered",
        },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        pdpaConsent,
        pdpaConsentDate: pdpaConsent ? new Date() : null,
        marketingConsent: marketingConsent || false,
        marketingConsentDate: marketingConsent ? new Date() : null,
      },
    });

    // Create session with JWT tokens
    const session = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return sanitized user data (exclude sensitive fields)
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        user: sanitizedUser,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
