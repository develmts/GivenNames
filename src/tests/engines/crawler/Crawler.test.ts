import { Crawler } from "@/tests/oldcrawler"
describe("Crawler", () => {
  it("should run from config without throwing", async () => {
    const config: any = { rootPath: ".", verbose: false }
    await expect(Crawler.runFromConfig(config)).resolves.not.toThrow()
  })
})
