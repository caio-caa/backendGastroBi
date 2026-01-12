import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  userType?: 'RESTAURANT' | 'ADMIN';
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    // Extract tenant ID from JWT payload (set by JwtAuthGuard)
    // For admin users, they can pass x-tenant-id header to access specific restaurants
    const headerTenantId = req.headers['x-tenant-id'] as string;

    if (headerTenantId) {
      req.tenantId = headerTenantId;
    }

    next();
  }
}
