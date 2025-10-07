// ./src/services/ApiService/index.ts
// Aggregates and mounts API routes for GivenNames

import { Hono } from 'hono'

// Import route modules (to be implemented in this folder)
import { authRoutes } from '@/services/ApiService/routes/auth.js'
import { nameRoutes } from '@/services/ApiService/routes/names.js'
import { userRoutes } from '@/services/ApiService/routes/users.js'
import { routesPing } from "@/services/ApiService/routes/ping.js"


// Create a router instance
export const apiRoutes = new Hono()

// Mount feature-specific routes
apiRoutes.route("/ping", routesPing)
apiRoutes.route('/auth', authRoutes)
apiRoutes.route('/names', nameRoutes)
apiRoutes.route('/users', userRoutes)
