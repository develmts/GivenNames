import { semImport } from '@/tests/engines/utils/importSemantic'; 
// "../../engines/utils/importSemantic"
describe("semImport", () => {
  it("should execute without errors on empty dir", () => {
    expect(() => semImport(".")).not.toThrow()
  })
})
