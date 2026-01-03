import { Response, NextFunction } from "express";
import * as jose from "jose";
import { IExtendedRequest } from "./type";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-jwt-secret");

export const authenticate = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = payload as any;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
