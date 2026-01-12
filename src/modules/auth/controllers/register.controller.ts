import { Request, Response } from "express";
import authService, { AuthError } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, schoolName, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Required fields (firstName, lastName, email, password) are missing"
      });
    }

    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      schoolName
    });

    // Don't set cookies for unverified users
    res.status(201).json({
      status: "success",
      message: result.message,
      requiresVerification: result.requiresVerification,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        emailVerified: result.user.emailVerified,
      },
    });
  } catch (error: any) {
    // Handle structured AuthError
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        status: "error",
        code: error.code,
        message: error.message,
        data: error.data,
      });
    }

    res.status(400).json({
      status: "error",
      code: "REGISTRATION_FAILED",
      message: error.message || "Registration failed",
    });
  }
};
