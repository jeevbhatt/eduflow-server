/**
 * Input Validation Service
 */

import { z } from "zod";
import xss from "xss";
import { Request, Response, NextFunction } from "express";

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") return input;
  return xss(input.trim(), xssOptions);
};

export const sanitizeObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return sanitizeString(obj) as unknown as T;
  if (Array.isArray(obj))
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
};

export const sanitizeBody = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object")
    req.body = sanitizeObject(req.body);
  next();
};

export const sanitizeQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.query && typeof req.query === "object") {
    const sanitized = sanitizeObject(req.query);
    try {
      // Mutate the existing query object in-place so downstream code that reads `req.query` sees sanitized values
      Object.assign(
        req.query as Record<string, any>,
        sanitized as Record<string, any>
      );
    } catch (e) {
      // Some request implementations expose `query` via a getter-only property; in that case attach a separate property
      (req as any).sanitizedQuery = sanitized;
    }
  }
  next();
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
};
