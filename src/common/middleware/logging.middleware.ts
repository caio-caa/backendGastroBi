import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const userAgent = req.get('User-Agent') || '';
    const start = Date.now();

    this.logger.log(`Incoming - ${method} ${originalUrl} - Body: ${JSON.stringify(body)} - User-Agent: ${userAgent}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      this.logger.log(`Outgoing - ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`);
    });

    next();
  }
}