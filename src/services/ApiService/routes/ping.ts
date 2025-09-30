import { Hono } from "hono"

export const routesPing = new Hono()

routesPing.get("/", (c) => c.json({ pong: true }))
