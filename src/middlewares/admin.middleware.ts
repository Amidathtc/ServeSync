/**
 * Admin Authorization Middleware
 * Ensures only users with ADMIN role can access protected routes
 */

import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Middleware to require ADMIN role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            error: 'Admin access required',
            message: 'You do not have permission to access this resource'
        });
    }

    next();
};

/**
 * Middleware to require either ADMIN or KITCHEN role
 * Useful for restaurant management endpoints
 */
export const requireAdminOrKitchen = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'KITCHEN') {
        return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Admin or kitchen role required'
        });
    }

    next();
};
