// src/services/ApiService/middleware/logging.ts
import Logger from "@/utils/logger"

const httpLog = Logger.get().child("http")

export const requestLogger = async (c: any, next: any) => {
  const { method, path } = c.req
  
  // const ip = c.req.header("x-forwarded-for") || c.req.raw.socket.remoteAddress
  let ip = "unkown"
  try{
      // Node.js  + BUN normalment
    ip = c.req.raw?.socket?.remoteAddress
      || c.req.raw?.conn?.remoteAddress
      // Proxy Friendly
      || c.req.header("x-forwarded-for")
      //Deno i fallback
      || "unknown";
  } catch {
    ip = "unknown";
  }

  const user = c.get("user")?.id || "anon"
  const reqSize = c.req.header("content-length") || "?"

  const start = Date.now()
  await next()
  const duration = Date.now() - start
  const status = c.res.status

  httpLog.info(`${method} ${path} -> ${status} (${duration}ms) ip=${ip} user=${user} size=${reqSize}`)
}
