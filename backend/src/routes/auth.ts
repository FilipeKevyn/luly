import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  addToBlocklist,
  isBlocklisted,
} from '@/services/auth';
import { z } from 'zod';

// Body schemas
const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutBodySchema = z.object({
  refreshToken: z.string().optional(),
});

// Response schemas
const authResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    permanent: z.boolean(),
  }),
});

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // POST /api/v1/auth/register
  typedApp.post(
    '/register',
    {
      schema: {
        body: registerBodySchema,
        response: {
          201: z.object({
            success: z.literal(true),
            data: authResponseSchema,
          }),
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered', permanent: true },
        });
      }

      const passwordHash = await hashPassword(password);

      const [user] = await db
        .insert(users)
        .values({ email, passwordHash, name })
        .returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });

      const accessToken = await createAccessToken(user.id, user.email);
      const { token: refreshToken } = await createRefreshToken(user.id);

      return reply.status(201).send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      });
    }
  );

  // POST /api/v1/auth/login
  typedApp.post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: z.object({
            success: z.literal(true),
            data: authResponseSchema,
          }),
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', permanent: true },
        });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', permanent: true },
        });
      }

      const accessToken = await createAccessToken(user.id, user.email);
      const { token: refreshToken } = await createRefreshToken(user.id);

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      });
    }
  );

  // POST /api/v1/auth/refresh
  typedApp.post(
    '/refresh',
    {
      schema: {
        body: refreshBodySchema,
        response: {
          200: z.object({
            success: z.literal(true),
            data: authResponseSchema,
          }),
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body;

      const payload = await verifyRefreshToken(refreshToken);
      if (!payload) {
        return reply.status(401).send({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token', permanent: true },
        });
      }

      if (await isBlocklisted(refreshToken)) {
        return reply.status(401).send({
          success: false,
          error: { code: 'TOKEN_REVOKED', message: 'Refresh token has been revoked', permanent: true },
        });
      }

      await addToBlocklist(refreshToken, payload.sub, new Date(payload.exp * 1000));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);
      
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User no longer exists', permanent: true },
        });
      }

      const accessToken = await createAccessToken(user.id, user.email);
      const { token: newRefreshToken } = await createRefreshToken(user.id);

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      });
    }
  );

  // POST /api/v1/auth/logout
  typedApp.post(
    '/logout',
    {
      schema: {
        body: logoutBodySchema,
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.object({ message: z.string() }),
          }),
        },
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { refreshToken } = request.body;

      if (refreshToken) {
        await addToBlocklist(refreshToken, request.user!.id, new Date(Date.now() + 7 * 86400000));
      }

      return reply.send({ success: true, data: { message: 'Logged out successfully' } });
    }
  );

  // GET /api/v1/auth/me
  typedApp.get(
    '/me',
    {
      schema: {
        response: {
          200: z.object({
            success: z.literal(true),
            data: userResponseSchema,
          }),
          404: errorResponseSchema,
        },
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const [user] = await db
        .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt, updatedAt: users.updatedAt })
        .from(users)
        .where(eq(users.id, request.user!.id))
        .limit(1);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found', permanent: true },
        });
      }

      return reply.send({
        success: true,
        data: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    }
  );
}