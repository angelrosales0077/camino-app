// @camino/api - Hono backend entry point
// Will be configured with Hono app and routes

import { Hono } from 'hono'

export const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
