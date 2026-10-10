import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        collegeId?: string | null;
        branchId?: string | null;
        avatarUrl?: string | null;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireRole: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const generateToken: (user: {
    id: string;
    email: string;
    role: UserRole;
    collegeId?: string | null;
    branchId?: string | null;
}) => string;
export declare const verifyToken: (token: string) => {
    id: string;
    email: string;
    role: UserRole;
    collegeId?: string | null;
    branchId?: string | null;
};
//# sourceMappingURL=auth.d.ts.map