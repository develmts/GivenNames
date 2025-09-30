// ./src/services/ApiService/routes/names.ts
// Routes for names-related operations
// NOTE: all POST and DELETE routes require "editor" role privileges

import { Hono } from 'hono'

export const nameRoutes = new Hono()

// --- Basic queries ---

// GET /names → list names (with optional filters)
nameRoutes.get('/', async (c) => {
  return c.json({ message: 'list names - not implemented' }, 501)
})

// GET /names/:id → get name by id
nameRoutes.get('/:id', async (c) => {
  return c.json({ message: 'get name by id - not implemented' }, 501)
})

// GET /names/:id/full → get name with all relations
nameRoutes.get('/:id/full', async (c) => {
  return c.json({ message: 'get full name data - not implemented' }, 501)
})

// --- Insertions (require "editor") ---

// POST /names → create new name
nameRoutes.post('/', async (c) => {
  // Requires role: editor
  return c.json({ message: 'create name - not implemented' }, 501)
})

// POST /names/atomic → create name + related data in one transaction
nameRoutes.post('/atomic', async (c) => {
  // Requires role: editor
  return c.json({ message: 'create atomic name - not implemented' }, 501)
})

// --- Updates ---

// PUT /names/:id → update name fields
nameRoutes.put('/:id', async (c) => {
  return c.json({ message: 'update name - not implemented' }, 501)
})

// --- Deletions (require "editor") ---

// DELETE /names/:id → delete a name
nameRoutes.delete('/:id', async (c) => {
  // Requires role: editor
  return c.json({ message: 'delete name - not implemented' }, 501)
})

// --- Variants ---

// GET /names/:id/variants
nameRoutes.get('/:id/variants', async (c) => {
  return c.json({ message: 'get variants - not implemented' }, 501)
})

// POST /names/:id/variants → add variant (requires editor)
nameRoutes.post('/:id/variants', async (c) => {
  // Requires role: editor
  return c.json({ message: 'add variant - not implemented' }, 501)
})

// DELETE /names/:id/variants/:variantId → remove variant (requires editor)
nameRoutes.delete('/:id/variants/:variantId', async (c) => {
  // Requires role: editor
  return c.json({ message: 'remove variant - not implemented' }, 501)
})

// --- Translations ---

// GET /names/:id/translations
nameRoutes.get('/:id/translations', async (c) => {
  return c.json({ message: 'get translations - not implemented' }, 501)
})

// POST /names/:id/translations → add translation (requires editor)
nameRoutes.post('/:id/translations', async (c) => {
  // Requires role: editor
  return c.json({ message: 'add translation - not implemented' }, 501)
})

// DELETE /names/:id/translations/:translationId → remove translation (requires editor)
nameRoutes.delete('/:id/translations/:translationId', async (c) => {
  // Requires role: editor
  return c.json({ message: 'remove translation - not implemented' }, 501)
})

// --- Clusters ---

// GET /names/:id/clusters
nameRoutes.get('/:id/clusters', async (c) => {
  return c.json({ message: 'get clusters - not implemented' }, 501)
})

// POST /names/:id/clusters → add to cluster (requires editor)
nameRoutes.post('/:id/clusters', async (c) => {
  // Requires role: editor
  return c.json({ message: 'add cluster - not implemented' }, 501)
})

// DELETE /names/:id/clusters/:clusterId → remove from cluster (requires editor)
nameRoutes.delete('/:id/clusters/:clusterId', async (c) => {
  // Requires role: editor
  return c.json({ message: 'remove cluster - not implemented' }, 501)
})
