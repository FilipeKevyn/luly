declare module 'fastify-sensible' {
  export function notFound(message?: string): never;
  export function badRequest(message?: string): never;
  export function unauthorized(message?: string): never;
  export function forbidden(message?: string): never;
  export function conflict(message?: string): never;
  export function unprocessableEntity(message?: string): never;
}