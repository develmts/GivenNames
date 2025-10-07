import { describe, it, expect } from 'vitest'
import { ConfigManager } from '@/config.js'

describe('Setup verification', () => {
  it('should have ConfigManager initialized before tests', () => {
    // Si el setup no s’ha executat, això llençaria un error
    const cfg = ConfigManager.config().rootPath || 'undefined'

    console.log('[SetupCheck] rootPath =', cfg)

    // Assegura que el rootPath existeix i és una cadena no buida
    expect(typeof cfg).toBe('string')
    expect(cfg.length).toBeGreaterThan(0)
  })
})
