import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * RequestIdMiddleware attaches a unique UUID to each request.
 *
 * - Prioritizes `X-Request-ID` if provided by the client (useful for distributed tracing).
 * - Generates a new UUID v4 if not present.
 * - The ID is attached to both the request object (for interceptors) and response header
 *   (for client correlation during debugging).
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request for subsequent layers (interceptors, services)
    (req as Request & { requestId?: string }).requestId = requestId;

    // Attach to response header for client debugging
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
