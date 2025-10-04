// ./src/server.ts
// Application module for GivenNames API Server
// Uses Hono framework, prepared for JWT + refresh token and RBAC
import fs from 'fs'

import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

import { apiRoutes } from '@/services/ApiService/routes'
import { requestLogger } from '@/services/ApiService/middleware/reqLogger'
import { errorHandler } from '@/services/ApiService/middleware/errorHandler'

import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import { readFileSync } from 'fs'
import Logger from '@/utils/logger'
import { AppConfig, ConfigManager } from '@/config'
const logger = Logger.get()
export class GivenNamesServer {
  public app: Hono
  private terminator: HttpTerminator | null = null

  constructor() {
    this.app = new Hono()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Customize 404 error
    this.app.notFound((c) =>
      c.json(
        { error: "Not Found", message: `Route ${c.req.path} not found` },
        404
      )
    )

    // Error handling middleware (first to catch all errors)
    this.app.use('*', errorHandler)

    // HTTP request logging middleware
    this.app.use('*', requestLogger)

    // Global middleware
    this.app.use('*', honoLogger())
    this.app.use('*', cors())
    this.app.use('*', prettyJSON())

    // Root route
    this.app.get('/', (c) =>
      c.json({ status: 'ok', message: 'GivenNames API Server' })
    )

    // Mount API service routes under /api
    this.app.route('/api', apiRoutes)
  }

  async run() {
    
    const { serve } = await import('@hono/node-server')
    const effectiveConfig = ConfigManager.config()
    // const port = Number(config.server.port) || 3000


    const port = Number(effectiveConfig.server.port || 3000)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      logger.error(`[server] Invalid PORT value: ${effectiveConfig.server.port}`)
      process.exit(1)
    }

    let httpServer: any

    if (effectiveConfig.server.useTLS) {
      if (!effectiveConfig.server.tlsKey || !effectiveConfig.server.tlsCert) {
        logger.error("TLS enabled but missing tlsKey/tlsCert")
        process.exit(1)
      }

      if (!effectiveConfig.server.tlsKey || !effectiveConfig.server.tlsCert) {
        logger.error("[server] TLS enabled but tlsKey/tlsCert missing")
        process.exit(1)
      }
      if (!fs.existsSync(effectiveConfig.server.tlsKey) || !fs.existsSync(effectiveConfig.server.tlsCert)) {
        logger.error("[server] TLS cert/key file not found")
        process.exit(1)
      }
      httpServer = serve({
        fetch: this.app.fetch,
        port,
        tls: {
          key: readFileSync(effectiveConfig.server.tlsKey),
          cert: readFileSync(effectiveConfig.server.tlsCert),
        },
      } as any)
      logger.info(`[server] HTTPS listening on https://localhost:${port}`)
    } else {
      httpServer = serve({ fetch: this.app.fetch, port })
      logger.info(`[server] HTTP listening on http://localhost:${port}`)
    }

    this.terminator = createHttpTerminator({ server: httpServer })
  }

  async shutdown() {
    try{
      if (this.terminator) {
        await this.terminator.terminate()
      }
    }catch(err){
      logger.error('HTTP termination Error: ${err.toString}')
    }
  }
}

// Export default instance for convenience
export const server = new GivenNamesServer()
export default server
