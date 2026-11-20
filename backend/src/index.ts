import Fastify, { FastifyInstance } from 'fastify';
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { env } from '@/config';
import { pool, checkConnection } from '@/db/client';
import { errorHandler, requestLogger, authMiddleware } from '@/middleware/auth';
import { authRoutes } from '@/routes/auth';
import { movieRoutes } from '@/routes/movies';
import { listRoutes } from '@/routes/lists';
import { viewingRoutes } from '@/routes/viewings';
import { syncRoutes } from '@/routes/sync';

// ============================================
// PLUGINS
// ============================================

async function registerPlugins(app: FastifyInstance) {
  // CORS
  await app.register(import('@fastify/cors'), {
    origin: env.NODE_ENV === 'development' ? true : ['https://luly.app', 'https://*.luly.app'],
    credentials: true,
  });

  // Helmet (security headers)
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
  });

  // Rate limiting
  await app.register(import('@fastify/rate-limit'), {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => req.ip,
  });
}

// ============================================
// ROUTES
// ============================================

async function registerRoutes(app: FastifyInstance) {
  // Decorate with auth middleware
  app.decorate('authMiddleware', authMiddleware);

  // Health checks
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/health/ready', async () => {
    const dbOk = await checkConnection();
    return { status: dbOk ? 'ready' : 'degraded', database: dbOk, timestamp: new Date().toISOString() };
  });

  // API v1 routes with Zod type provider
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(movieRoutes, { prefix: '/movies' });
  await app.register(listRoutes, { prefix: '/lists' });
  await app.register(viewingRoutes, { prefix: '/viewings' });
  await app.register(syncRoutes, { prefix: '/sync' });

  // Apply Zod type provider to app after all routes are registered
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // 404 handler
  typedApp.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found', permanent: true },
    });
  });
}

// ============================================
// MAIN
// ============================================

async function main() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
    ajv: { customOptions: { strict: false } },
  });

  // Zod schema compilers (required for fastify-type-provider-zod)
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Error handling
  app.setErrorHandler(errorHandler);

  // Request logging
  app.addHook('onRequest', requestLogger);

  // Register plugins
  await registerPlugins(app);

  // Register routes
  await registerRoutes(app);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      await pool.end();
      console.log('✅ Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start server
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();