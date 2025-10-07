// src/tests/config-init.ts
import path from "path"
import { fileURLToPath } from "url"
import { ConfigManager } from "@/config.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootPath = path.resolve(__dirname, "../..")

// Initialize singleton before any test imports ConfigManager
ConfigManager.config(rootPath)

console.log("[config-init] ConfigManager initialized with rootPath:", rootPath)
