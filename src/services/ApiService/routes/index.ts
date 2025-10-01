// ./src/services/ApiService/index.ts
// Aggregates and mounts API routes for GivenNames V5

import { Hono } from 'hono'

// Import route modules (to be implemented in this folder)
import { authRoutes } from '@/services/ApiService/routes/auth'
import { nameRoutes } from '@/services/ApiService/routes/names'
import { userRoutes } from '@/services/ApiService/routes/users'
import { routesPing } from "@/services/ApiService/routes/ping"


// Create a router instance
export const apiRoutes = new Hono()

// Mount feature-specific routes
apiRoutes.route("/ping", routesPing)
apiRoutes.route('/auth', authRoutes)
apiRoutes.route('/names', nameRoutes)
apiRoutes.route('/users', userRoutes)
