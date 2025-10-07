import { ConfigManager } from "@/config.js"
import { WikipediaCrawler } from "@/engines/crawler/WikipediaCrawler.js"
describe("Wikipedia Crawler", () => {
  const cfg = ConfigManager.config()
  test("should run from config without throwing", async () => {
    const config: any = { rootPath: ".", verbose: false }
    await expect(WikipediaCrawler.runFromConfig(config)).resolves.not.toThrow()
  })
})
