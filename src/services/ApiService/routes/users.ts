// ./src/services/ApiService/routes/users.ts
// Routes for user-related operations


import { 
  UserMeResponse, 
  UpdatePasswordRequest, 
  UpdatePasswordResponse, 
  PatchUserRequest, 
  PatchUserResponse 
} from '@/services/ApiService/types/users'

import { Hono } from 'hono'
import { requireAuth } from '@/services/ApiService/middleware/auth'
import { UserService } from '@/services/UserService'
import { AuthService } from '@/services/ApiService/AuthService'
import {makeError } from "@/services/ApiService/utils/httpErrors"

export const userRoutes = new Hono()

/**
 * GET /users/me
 * - Precondition: valid access token
 * - Returns public details of the authenticated user
 */
userRoutes.get('/me', requireAuth(), async (c) => {
  const user = AuthService.getCurrentUser(c)
  if (!user) return makeError(c, 401, "MISSING_ACCESS_TOKEN")

  return c.json({
    id: user.id,       // 👈 usar sub
    roles: user.roles,
  })

})

/**
 * POST /users/update
 * - Precondition: valid access token
 * - Request body: { oldPassword, newPassword }
 * - Action: verify old password, hash new one, update DB
 * - Security: invalidate existing refresh tokens
 */
userRoutes.post("/update", async (c) => {
  const body: UpdatePasswordRequest = await c.req.json()
  const user = AuthService.getCurrentUser(c)
  if (!user) {
    return makeError(c, 401, "MISSING_ACCESS_TOKEN", "Access token rºequired")
  }
  if (!body.oldPassword || !body.newPassword) {
    return c.json({ error: "Missing Fields" }, 400)
  }

  UserService.updatePassword(user.id, body.oldPassword, body.newPassword)

  const response: UpdatePasswordResponse = { message: "Password updated" }
  return c.json(response)
})

/**
 * PATCH /users/me   (future feature)
 * - Precondition: valid access token
 * - Allows updating non-critical user fields (e.g. description, photo)
 * - Critical fields like username, email, and roles cannot be modified here
 */

userRoutes.patch('/me', requireAuth(), async (c) => {
  // return c.json({ message: 'patch current user - not implemented' }, 501)
  // 1 RequireAuth() warrants that token hAS BEEN VALIDATED
  // 2. READ bODY
  const body = await c.req.json<{
    description?: string
    avatarUrl?: string
    displayName?: string
  }>()

  const allowedFields = ["description", "avatarUrl", "displayName"]

  for( const k of Object.keys(body)){
    if (!allowedFields.includes(k)){
      return makeError(c,403,"Forbidden field in update")
    }
 
  }

  // 3. Update Profile
  const user = AuthService.getCurrentUser(c)
  await UserService.updateProfile(user.id, body)

  // 4. Return  message
  return c.json({ message: "Profile updated" })

})

