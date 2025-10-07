import { Hono } from "hono"

export const routesPing = new Hono()

routesPing.get("/", (c) => {
  return c.json({ pong: true })
})
