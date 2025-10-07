import { semImport } from '@/engines/utils/importSemantic.js'; 
// "../../engines/utils/importSemantic"
describe("semImport", () => {
  it("should execute without errors on empty dir", () => {
    expect(() => semImport(".")).not.toThrow()
  })
})
