import { Response, NextFunction } from "express";
import * as jose from "jose";
import { IExtendedRequest } from "./type";
import prisma from "../database/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-jwt-secret");

export const authenticate = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
  try {
    let token = "";
    const authHeader = req.headers.authorization;

    // 1. Check Bearer Token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // 2. Check eduflow_auth_token Cookie (Standardized)
    else if (req.cookies?.eduflow_auth_token) {
      token = req.cookies.eduflow_auth_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = payload as any;

    // 3. Resolve instituteId from tenant subdomain (Secure multi-tenancy)
    if (req.tenant?.subdomain) {
      const institute = await prisma.institute.findUnique({
        where: { subdomain: req.tenant.subdomain },
        select: { id: true }
      });

      if (!institute) {
        return res.status(404).json({
          status: "error",
          message: "Tenant institute not found",
          code: "INVALID_TENANT"
        });
      }

      req.instituteId = institute.id;
    } else {
      // Fallback: Check if user owns an institute (for Institute Admins on main domain)
      if (req.user?.role === "institute" || req.user?.role === "admin") {
         const ownedInstitute = await prisma.institute.findFirst({
            where: { ownerId: req.user.id },
            select: { id: true }
         });
         if (ownedInstitute) {
            req.instituteId = ownedInstitute.id;
         }
      }

      // If still not found, allow explicit passing (validation should handle authorization)
      if (!req.instituteId) {
         req.instituteId = (req.query.instituteId as string) || (req.body.instituteId as string);
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
