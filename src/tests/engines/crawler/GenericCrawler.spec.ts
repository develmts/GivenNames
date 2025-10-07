import { ConfigManager } from "@/config.js"
import { GenericCrawler } from "@/engines/crawler/GenericCrawler.js"
describe("GemericCrawler", () => {
  const cfg = ConfigManager.config()
  test("should run from config without throwing", async () => {
    
    await expect(GenericCrawler.runFromConfig(cfg)).resolves.not.toThrow()
  })
})
