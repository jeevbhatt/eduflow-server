import { Request } from 'express';

export interface IExtendedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    currentInstituteNumber?: string;
  };
  tenant?: {
    subdomain: string;
    sanitizedId: string;
  };
  instituteId?: string;
  prisma?: any; // Context-aware Prisma client
  file?: Express.Multer.File;
}
