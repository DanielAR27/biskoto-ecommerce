const {
  getCompras,
  getCompraById,
  createCompra,
  deleteCompra,
} = require("../../../src/controllers/comprasController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase
jest.mock("../../../src/config/supabase", () => ({
  from: jest.fn(),
}));

describe("ComprasController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  // Utilidad para construir mocks encadenables de Supabase
  const createMockQueryBuilder = (mockResponse = { data: [], error: null }) => {
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      then: jest.fn((resolve) => resolve(mockResponse)),
    };
  };

  beforeAll(() => {
    // Se silencia la consola de errores para mantener limpia la salida del test
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getCompras", () => {
    test("Se obtiene la lista de compras exitosamente", async () => {
      const mockData = [{ id: 1, proveedor_id: 2 }];
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await getCompras(req, res);

      expect(supabase.from).toHaveBeenCalledWith("compras");
      expect(builder.select).toHaveBeenCalled();
      expect(builder.order).toHaveBeenCalledWith("fecha_compra", { ascending: false });
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se maneja error de base de datos al obtener compras", async () => {
      const builder = createMockQueryBuilder({ data: null, error: { message: "DB Error" } });
      supabase.from.mockReturnValue(builder);

      await getCompras(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener las compras." });
    });

    test("Se maneja excepción inesperada (bloque catch)", async () => {
      supabase.from.mockImplementation(() => {
        throw new Error("Crash");
      });

      await getCompras(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getCompraById", () => {
    test("Se obtiene el detalle de una compra por ID correctamente", async () => {
      req.params.id = "10";
      const mockData = { id: 10, items: [] };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await getCompraById(req, res);

      expect(builder.eq).toHaveBeenCalledWith("id", "10");
      expect(builder.single).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se retorna 404 si la compra no existe o hay error en la consulta", async () => {
      req.params.id = "999";
      // El controlador valida "if (error) return res.status(404)..."
      const builder = createMockQueryBuilder({ data: null, error: { message: "Not found" } });
      supabase.from.mockReturnValue(builder);

      await getCompraById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Compra no encontrada." });
    });

    test("Se maneja excepción inesperada al buscar compra", async () => {
      req.params.id = "10";
      supabase.from.mockImplementation(() => {
        throw new Error("Crash");
      });

      await getCompraById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener el detalle de la compra." });
    });
  });

  describe("createCompra", () => {
    beforeEach(() => {
      req.body = {
        proveedor_id: 1,
        monto_total: 1000,
        notas: "Test",
        items: [
          { ingrediente_id: 5, cantidad: 10, precio_unitario: 50 },
          { ingrediente_id: 6, cantidad: 5, precio_unitario: 100 },
        ],
      };
    });

    test("Se crea la compra y sus items exitosamente", async () => {
      const mockCompra = { id: 100, proveedor_id: 1 };
      
      // Mock 1: Inserción de cabecera (compras)
      const mockInsertHeader = createMockQueryBuilder({ data: mockCompra, error: null });
      
      // Mock 2: Inserción de items (compra_items)
      const mockInsertItems = createMockQueryBuilder({ data: null, error: null });

      supabase.from
        .mockReturnValueOnce(mockInsertHeader) // Primera llamada: compras
        .mockReturnValueOnce(mockInsertItems); // Segunda llamada: compra_items

      await createCompra(req, res);

      // Verificaciones
      expect(mockInsertHeader.insert).toHaveBeenCalledWith([{
        proveedor_id: 1,
        monto_total: 1000,
        notas: "Test"
      }]);

      expect(mockInsertItems.insert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ compra_id: 100, ingrediente_id: 5 }),
        expect.objectContaining({ compra_id: 100, ingrediente_id: 6 })
      ]));

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCompra);
    });

    test("Se retorna 400 si falla la inserción de la cabecera de compra", async () => {
      const mockErrorHeader = createMockQueryBuilder({ data: null, error: { message: "Error Header" } });
      supabase.from.mockReturnValueOnce(mockErrorHeader);

      await createCompra(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Error Header" });
    });

    test("Se retorna 400 si falla la inserción de los ítems", async () => {
      // Cabecera OK
      const mockInsertHeader = createMockQueryBuilder({ data: { id: 100 }, error: null });
      // Items Fail
      const mockErrorItems = createMockQueryBuilder({ data: null, error: { message: "Error Items" } });

      supabase.from
        .mockReturnValueOnce(mockInsertHeader)
        .mockReturnValueOnce(mockErrorItems);

      await createCompra(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Error Items" });
    });

    test("Se maneja error si req.body.items no es un array (crash en .map)", async () => {
      req.body.items = null; // Esto provocará excepción en items.map
      
      // Mock cabecera OK para que avance hasta el mapeo
      const mockInsertHeader = createMockQueryBuilder({ data: { id: 100 }, error: null });
      supabase.from.mockReturnValue(mockInsertHeader);

      await createCompra(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // El mensaje será generado por JS (ej: "Cannot read properties of null...")
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe("deleteCompra", () => {
    test("Se elimina la compra exitosamente", async () => {
      req.params.id = "50";
      const builder = createMockQueryBuilder({ data: null, error: null });
      supabase.from.mockReturnValue(builder);

      await deleteCompra(req, res);

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "50");
      expect(res.json).toHaveBeenCalledWith({ message: "Compra eliminada y stock revertido exitosamente." });
    });

    test("Se maneja error de base de datos al eliminar", async () => {
      req.params.id = "50";
      const builder = createMockQueryBuilder({ data: null, error: { message: "Constraint Error" } });
      supabase.from.mockReturnValue(builder);

      await deleteCompra(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "No se pudo eliminar la compra." });
    });

    test("Se maneja excepción inesperada durante la eliminación", async () => {
      req.params.id = "50";
      supabase.from.mockImplementation(() => { throw new Error("Crash"); });

      await deleteCompra(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});