import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { verifyAccessToken, isBlocklisted } from '@/services/auth';
import { env } from '@/config';

// ============================================
// TYPES
// ============================================

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
    tokenJti?: string;
  }
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
        permanent: true,
      },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  // Check blocklist
  if (await isBlocklisted(token)) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked',
        permanent: true,
      },
    });
    return;
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        permanent: true,
      },
    });
    return;
  }

  request.user = {
    id: payload.sub,
    email: payload.email,
  };
}

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return; // Continue without user
  }

  const token = authHeader.slice(7);

  if (await isBlocklisted(token)) {
    return; // Continue without user
  }

  const payload = await verifyAccessToken(token);
  if (payload) {
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  }
}

// ============================================
// RATE LIMITING
// ============================================

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const rateLimitPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    // Skip rate limiting for health checks
    if (request.url === '/health' || request.url === '/health/ready') {
      return;
    }

    // Simple in-memory rate limiting (para produção usar Redis)
    const ip = request.ip;
    const key = `ratelimit:${ip}`;
    // Implementation would go here with a proper store
  });
};

export { rateLimitPlugin };

// ============================================
// ERROR HANDLING
// ============================================

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
  });

  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        permanent: true,
      },
    });
  }

  // Database errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    return reply.status(409).send({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
        permanent: true,
      },
    });
  }

  if (error.message.includes('foreign key')) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist',
        permanent: true,
      },
    });
  }

  // Default 500
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      permanent: false,
    },
  });
}

// ============================================
// REQUEST LOGGING
// ============================================

export function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const start = Date.now();
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000 || env.NODE_ENV === 'development') {
      console.log(`${request.method} ${request.url} ${reply.statusCode} ${duration}ms`);
    }
  });
  done();
}