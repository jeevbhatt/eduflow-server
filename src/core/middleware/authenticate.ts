import { Response, NextFunction } from "express";
import * as jose from "jose";
import { IExtendedRequest } from "./type";
import prisma from "../database/prisma";
import { contextStorage } from "../utils/contextStore";
import { JWT_SECRET_UINT8 } from "../config/jwt.config";

export const authenticate = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
  try {
    let token = "";
    const authHeader = req.headers.authorization;

    // 1. Resolve Identity (Who is the user?)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.eduflow_auth_token) {
      token = req.cookies.eduflow_auth_token;
    }

    if (!token) {
      console.log("[Auth Debug] No token provided in headers or cookies");
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      console.log("[Auth Debug] Verifying token length:", token.length);
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8);
      console.log("[Auth Debug] Token verified successfully for user:", payload.id);

      if (!payload || !payload.id) {
        console.error("[Auth Debug] Token verified but payload is missing 'id'");
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      req.user = payload as any;
    } catch (jwtErr: any) {
      console.error("[Auth Debug] JWT Verify failed:", jwtErr.message);
      return res.status(401).json({
        message: "Invalid or expired token",
        debug: process.env.NODE_ENV === "development" ? jwtErr.message : undefined,
        code: jwtErr.code || "JWT_ERROR"
      });
    }

    // 2. Resolve Context (Which institute are they accessing?)
    // Priority 1: Subdomain (Hardest to spoof)
    if (req.tenant?.subdomain) {
      const institute = await prisma.institute.findUnique({
        where: { subdomain: req.tenant.subdomain },
        select: { id: true, ownerId: true }
      });

      if (!institute) {
        return res.status(404).json({
          status: "error",
          message: "Institute not found at this subdomain",
          code: "INVALID_TENANT"
        });
      }

      req.instituteId = institute.id;

      // Security check: Does user have access to THIS institute?
      if (req.user?.role !== "super-admin") {
         if (institute.ownerId === req.user?.id) {
            // Authorized as owner
         } else {
            const [student, teacher] = await Promise.all([
               prisma.student.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } }),
               prisma.teacher.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } })
            ]);

            (req as any).isMember = !!(student || teacher);
         }
      }
    }
    // Priority 2: Query/Body (For cross-origin or admin actions)
    else {
      req.instituteId = (req.query?.instituteId as string) || (req.body?.instituteId as string);

      // Fallback: Default to their own institute if they are an admin
      if (!req.instituteId && (req.user?.role === "institute" || req.user?.role === "admin")) {
        const owned = await prisma.institute.findFirst({
           where: { ownerId: req.user?.id },
           select: { id: true }
        });
        if (owned) req.instituteId = owned.id;
      }
    }

    // 3. Attach Contextual Prisma Client
    req.prisma = prisma;

    // Wrap the rest of the request in the context
    contextStorage.run({
      instituteId: req.instituteId || "",
      userId: req.user?.id,
      role: req.user?.role
    }, () => {
      next();
    });
  } catch (error: any) {
    console.error("[Auth] Global Middleware Error:", error.message || error);
    return res.status(401).json({
      message: "Authentication failed",
      code: "AUTH_ERROR",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
