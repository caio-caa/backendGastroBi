import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload } from '../auth.service';

// Custom extractor that checks both cookie and Authorization header
const cookieOrBearerExtractor = (req: Request): string | null => {
  // First try to get from cookie
  if (req?.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  
  // Fallback to Authorization header
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'gastrobi-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      type: payload.type,
      role: payload.role,
      currentRestaurantId: payload.currentRestaurantId,
    };
  }
}
