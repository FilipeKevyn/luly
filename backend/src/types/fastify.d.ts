import 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authMiddleware: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
    tokenJti?: string;
  }
}