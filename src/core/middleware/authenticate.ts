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

    console.log("[Auth Debug] Verifying token. Secret length:", JWT_SECRET_UINT8.length);
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8);
      console.log("[Auth Debug] Token verified successfully for user:", payload.id);

      if (!payload || !payload.id) {
        console.error("[Auth Debug] Token verified but payload is missing 'id'");
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      req.user = payload as any;
    } catch (jwtErr: any) {
      console.error("[Auth Debug] JWT Verify failed:", jwtErr.message);
      return res.status(401).json({ message: "Invalid or expired token" });
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
      // Skip check for super-admins or internal reserved subdomains (handled by tenantMiddleware)
      if (req.user?.role !== "super-admin") {
         // Check if owner
         if (institute.ownerId === req.user?.id) {
            // Authorized as owner
         } else {
            // Check if student/teacher in this specific institute
            const [student, teacher] = await Promise.all([
               prisma.student.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } }),
               prisma.teacher.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } })
            ]);

            const isMember = !!(student || teacher);

            // For now, we attach the member status to the request if needed
            (req as any).isMember = isMember;
         }
      }
    }
    // Priority 2: Query/Body (For cross-origin or admin actions)
    else {
      req.instituteId = (req.query.instituteId as string) || (req.body.instituteId as string);

      // Fallback: Default to their own institute if they are an admin
      if (!req.instituteId && (req.user?.role === "institute" || req.user?.role === "admin")) {
        const owned = await prisma.institute.findFirst({
           where: { ownerId: req.user?.id },
           select: { id: true }
        });
        if (owned) req.instituteId = owned.id;
      }
    }

    // 3. Attach Contextual Prisma Client (Phase 3: RLS Implementation)
    // Now handled automatically via AsyncLocalStorage in prisma.ts
    req.prisma = prisma;

    // Wrap the rest of the request in the context
    contextStorage.run({
      instituteId: req.instituteId!,
      userId: req.user?.id,
      role: req.user?.role
    }, () => {
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
