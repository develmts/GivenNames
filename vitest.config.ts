import { defineConfig } from 'vitest/config'
import tsconfigPaths from "vite-tsconfig-paths"
import { fileURLToPath } from "url"
import path from "path"

const rootDir = path.dirname(fileURLToPath(import.meta.url))


export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    }
  },
  // plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['src/tests/**/*.{test,spec}.{ts,js}'], // manté .test.ts de moment
    bail: 0,
    isolate:true,
    environment: 'node',
    setupFiles: [path.resolve(rootDir, 'src/tests/config-init.ts')],
    // @ts-expect-error setupFilesAfterEnv is supported in Vitest >=1.2
    setupFilesAfterEnv: [path.resolve(rootDir, 'vitest-setup.ts')],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ["text", "html", "lcov", "json-summary"],
      all: true,                          // mesura encara que no s’hagin importat
      include: ["src/**/*.{ts,js}"],      // arxius a mesurar     
      exclude: [
        "tests/**",
        "dist/**",
        "**/*.d.ts"
      ],
      thresholds: {
        lines: 80,
        functions: 80, 
        branches: 80, 
        statements: 80 ,
        perFile: true
      }       
    },
  },
})

