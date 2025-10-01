// ./src/services/ApiService/middleware/auth.ts
// Middleware for authentication and RBAC role checks

import type { Context, Next } from 'hono'
import { verifyAccessToken } from '@/services/ApiService/utils/jwt'

// Require a valid access token
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const header = c.req.header('Authorization')
    if (!header?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const token = header.slice(7)
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }
    // Attach user payload to context
    c.set('user', decoded)
    await next()
  }
}

// Require that the user has at least one of the given roles
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as { roles?: string[] }
    if (!user || !user.roles) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    const hasRole = user.roles.some((r) => allowedRoles.includes(r))
    if (!hasRole) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}
