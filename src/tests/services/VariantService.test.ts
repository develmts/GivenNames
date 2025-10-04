// tests/services/VariantService.test.ts
import { GivenNamesORM } from  '@/orm/GivenNamesORM'
import { VariantService } from '@/services/VariantService'

jest.mock("../../../src/orm/GivenNamesORM"); // ORM Mock 

const mockORM = {
  addVariant: jest.fn(),
  removeVariant: jest.fn(),
  getVariantIds: jest.fn(),
  getVariantsByName: jest.fn(),
  listAllVariants: jest.fn(),
};

beforeEach(() => {
  (GivenNamesORM.connect as jest.Mock).mockReturnValue(mockORM);
  jest.clearAllMocks();
});

describe("VariantService", () => {
  let service: VariantService;

  beforeEach(() => {
    service = new VariantService();
  });

  describe("addVariant", () => {
    it("ignora si nameId === variantId", async () => {
      await service.addVariant(1, 1);
      expect(mockORM.addVariant).not.toHaveBeenCalled();
    });

    it("afegeix una relació bidireccional", async () => {
      await service.addVariant(1, 2);
      expect(mockORM.addVariant).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("removeVariant", () => {
    it("elimina la relació bidireccional", async () => {
      await service.removeVariant(3, 4);
      expect(mockORM.removeVariant).toHaveBeenCalledWith(3, 4);
    });
  });

  describe("getVariants", () => {
    it("retorna els ids de variants d’un nom", async () => {
      mockORM.getVariantIds.mockReturnValue([2, 3]);
      const res = await service.getVariants(1);
      expect(res).toEqual([2, 3]);
    });
  });

  describe("getVariantGroup", () => {
    it("retorna tota la component connexa amb BFS", async () => {
      mockORM.getVariantIds.mockImplementation((id: number) => {
        if (id === 1) return [2];
        if (id === 2) return [1, 3];
        if (id === 3) return [2];
        return [];
      });
      const res = await service.getVariantGroup(1);
      expect(res.sort()).toEqual([1, 2, 3]);
    });

    it("retorna només el node si no té veïns", async () => {
      mockORM.getVariantIds.mockReturnValue([]);
      const res = await service.getVariantGroup(5);
      expect(res).toEqual([5]);
    });
  });

  describe("findVariants", () => {
    it("afegeix variants manuals amb confidence 0.5", () => {
      const res = service.findVariants("John", "en", "m", ["Johnny"]);
      expect(res).toContainEqual({ name: "Johnny", confidence: 0.5 });
    });

    it("afegeix variants de DB amb confidence 0.9", () => {
      mockORM.getVariantsByName.mockReturnValue([{ name: "Juan" }]);
      const res = service.findVariants("John", "es", "m");
      expect(res).toContainEqual({ name: "Juan", confidence: 0.9 });
    });

    it("continua funcionant encara que l’ORM llanci error", () => {
      mockORM.getVariantsByName.mockImplementation(() => {
        throw new Error("DB fail");
      });
      const res = service.findVariants("John", "es", "m");
      expect(res).toEqual([]);
    });
  });

  describe("listAll", () => {
    it("retorna totes les variants amb confidence 0.9", () => {
      mockORM.listAllVariants.mockReturnValue([{ name: "Giovanni" }]);
      const res = service.listAll(10);
      expect(res).toEqual([{ name: "Giovanni", confidence: 0.9 }]);
    });

    it("propaga l’error si falla l’ORM", () => {
      mockORM.listAllVariants.mockImplementation(() => {
        throw new Error("DB crash");
      });
      expect(() => service.listAll()).toThrow("DB crash");
    });
  });
});
