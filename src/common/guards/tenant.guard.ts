import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin users can access any tenant via x-tenant-id header
    if (user.type === 'ADMIN') {
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId) {
        request.tenantId = headerTenantId;
      }
      return true;
    }

    // Restaurant users must have a current restaurant
    if (!user.currentRestaurantId) {
      throw new ForbiddenException('No restaurant context');
    }

    request.tenantId = user.currentRestaurantId;
    return true;
  }
}
