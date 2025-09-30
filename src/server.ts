// ./src/server.ts
// Application module for GivenNames V5 API Server
// Uses Hono framework, prepared for JWT + refresh token and RBAC
import { ConfigManager } from './config'
const cfg = ConfigManager.config(process.cwd())


import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

// Import routes from ApiService (to be implemented)
import { apiRoutes } from './services/ApiService/routes'
// IMport http logging middleware
import { requestLogger } from './services/ApiService/middleware/reqLogger'
// Import error handling middleware
import { errorHandler } from './services/ApiService/middleware/errorHandler'

// Main application instance
const server: Hono = new Hono()
// Customize 404 error
// dins server.ts
server.notFound((c) => {
  return c.json(
    { error: "Not Found", message: `Route ${c.req.path} not found` },
    404
  )
})
// Error handling middleware (first to catch all errors)
server.use('*', errorHandler)
// HTTP request logging middleware (after error handler to log errors too)
server.use('*', requestLogger)

// Global middleware
server.use('*', honoLogger())
server.use('*', cors())
server.use('*', prettyJSON())

// Root route
server.get('/', (c) => c.json({ status: 'ok', message: 'GivenNames API Server' }))

// Mount API service routes under /api
server.route('/api', apiRoutes)

// Export application (no CLI bootstrap here)
export default server
