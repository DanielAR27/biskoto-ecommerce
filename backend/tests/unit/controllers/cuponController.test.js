const {
  listarCupones,
  obtenerCupon,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
  validarCupon,
} = require("../../../src/controllers/cuponController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase
jest.mock("../../../src/config/supabase", () => ({
  from: jest.fn(),
}));

describe("CuponController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  // Utilidad para construir mocks encadenables de Supabase (Builder Pattern)
  const createMockQueryBuilder = (mockResponse = { data: [], error: null }) => {
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      // 'then' permite usar await directamente sobre el builder sin llamar a single() en listas
      then: jest.fn((resolve) => resolve(mockResponse)),
    };
  };

  beforeAll(() => {
    // Se silencia la consola para evitar ruido en los tests
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

  /**
   * SECCIÓN: LISTAR CUPONES
   */
  describe("listarCupones", () => {
    test("Se listan todos los cupones exitosamente", async () => {
      const mockData = [{ id: 1, codigo: "TEST" }];
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await listarCupones(req, res);

      expect(builder.select).toHaveBeenCalledWith("*");
      expect(builder.order).toHaveBeenCalledWith("id", { ascending: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se maneja error de base de datos al listar", async () => {
      const builder = createMockQueryBuilder({ data: null, error: { message: "DB Error" } });
      // Se sobreescribe 'then' para simular el error en la promesa
      builder.then = jest.fn((resolve, reject) => resolve({ data: null, error: { message: "DB Error" } }));
      
      supabase.from.mockReturnValue(builder);

      await listarCupones(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener el listado de cupones." });
    });
  });

  /**
   * SECCIÓN: OBTENER CUPÓN POR ID
   */
  describe("obtenerCupon", () => {
    test("Se obtiene un cupón específico exitosamente", async () => {
      req.params.id = "1";
      const mockData = { id: 1, codigo: "TEST" };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await obtenerCupon(req, res);

      expect(builder.eq).toHaveBeenCalledWith("id", "1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se retorna 404 si el cupón no existe", async () => {
      req.params.id = "99";
      // Caso 1: Error explícito
      const builder = createMockQueryBuilder({ data: null, error: { message: "Not found" } });
      supabase.from.mockReturnValue(builder);

      await obtenerCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Cupón no encontrado." });
    });

    test("Se retorna 404 si la data es nula (aunque no haya error explícito)", async () => {
      req.params.id = "99";
      const builder = createMockQueryBuilder({ data: null, error: null });
      supabase.from.mockReturnValue(builder);

      await obtenerCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Se maneja excepción inesperada al obtener cupón", async () => {
      req.params.id = "1";
      supabase.from.mockImplementation(() => { throw new Error("Crash"); });

      await obtenerCupon(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: CREAR CUPÓN
   */
  describe("crearCupon", () => {
    test("Se valida que código y porcentaje sean obligatorios", async () => {
      req.body = { codigo: "", descuento_porcentaje: 10 };
      await crearCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El código y el porcentaje son obligatorios." });

      req.body = { codigo: "ABC", descuento_porcentaje: null };
      await crearCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Se valida rango del porcentaje (1-100)", async () => {
      req.body = { codigo: "TEST", descuento_porcentaje: 0 };
      await crearCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { codigo: "TEST", descuento_porcentaje: 101 };
      await crearCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Se crea cupón exitosamente (código a mayúsculas y activo por defecto)", async () => {
      req.body = { codigo: "test", descuento_porcentaje: 20 };
      
      const mockData = { id: 1, codigo: "TEST", activo: true };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await crearCupon(req, res);

      // Se verifica que se guardó en mayúsculas y activo true por defecto
      expect(builder.insert).toHaveBeenCalledWith([expect.objectContaining({
        codigo: "TEST",
        activo: true,
        fecha_expiracion: null
      })]);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Cupón creado exitosamente." }));
    });

    test("Se respeta el valor de 'activo' si se envía falso", async () => {
      req.body = { codigo: "OFF", descuento_porcentaje: 50, activo: false };
      
      const builder = createMockQueryBuilder({ data: { id: 1 }, error: null });
      supabase.from.mockReturnValue(builder);

      await crearCupon(req, res);

      expect(builder.insert).toHaveBeenCalledWith([expect.objectContaining({ activo: false })]);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("Se maneja error de código duplicado (23505)", async () => {
      req.body = { codigo: "DUP", descuento_porcentaje: 10 };
      
      const builder = createMockQueryBuilder({ data: null, error: { code: "23505" } });
      supabase.from.mockReturnValue(builder);

      await crearCupon(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Ya existe un cupón con este código." });
    });

    test("Se maneja error genérico de base de datos", async () => {
      req.body = { codigo: "ERR", descuento_porcentaje: 10 };
      
      const builder = createMockQueryBuilder({ data: null, error: { message: "Fail" } });
      supabase.from.mockReturnValue(builder);

      await crearCupon(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: ACTUALIZAR CUPÓN
   */
  describe("actualizarCupon", () => {
    test("Se actualiza el cupón correctamente (convirtiendo código a mayúsculas)", async () => {
      req.params.id = "1";
      req.body = { codigo: "nuevo", descuento_porcentaje: 15 };

      const builder = createMockQueryBuilder({ data: [], error: null });
      supabase.from.mockReturnValue(builder);

      await actualizarCupon(req, res);

      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ codigo: "NUEVO" }));
      expect(builder.eq).toHaveBeenCalledWith("id", "1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se permite actualizar sin enviar código (branch coverage codigo?)", async () => {
      req.params.id = "1";
      req.body = { descuento_porcentaje: 30 }; // Sin código

      const builder = createMockQueryBuilder({ data: [], error: null });
      supabase.from.mockReturnValue(builder);

      await actualizarCupon(req, res);

      // Se verifica que no se intentó hacer toUpperCase() sobre undefined
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ descuento_porcentaje: 30 }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se maneja error al actualizar", async () => {
      req.params.id = "1";
      req.body = { codigo: "X" };
      
      const builder = createMockQueryBuilder({ data: null, error: { message: "Fail" } });
      builder.then = jest.fn((resolve, reject) => reject(new Error("Fail"))); // Se fuerza el throw en controller
      
      // Dado que el controller hace `if (error) throw error;`,  se simula el error en el retorno
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: "Fail" } })
      });

      await actualizarCupon(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: ELIMINAR CUPÓN
   */
  describe("eliminarCupon", () => {
    test("Se elimina el cupón exitosamente", async () => {
      req.params.id = "1";
      const builder = createMockQueryBuilder({ error: null });
      supabase.from.mockReturnValue(builder);

      await eliminarCupon(req, res);

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se maneja error al eliminar", async () => {
      req.params.id = "1";
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: "Fail" } })
      });

      await eliminarCupon(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: VALIDAR CUPÓN (Lógica compleja de fechas)
   */
  describe("validarCupon", () => {
    test("Se valida que el código sea obligatorio", async () => {
      req.body = { codigo: "" };
      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Falta el código." });
    });

    test("Se retorna 404 si el código no existe", async () => {
      req.body = { codigo: "NOEXISTE" };
      const builder = createMockQueryBuilder({ data: null, error: { message: "Not found" } });
      supabase.from.mockReturnValue(builder);

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Se retorna 400 si el cupón está inactivo", async () => {
      req.body = { codigo: "INACTIVO" };
      const mockData = { id: 1, activo: false };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Este cupón ya no está activo." });
    });

    test("Se retorna 400 si el cupón ha expirado", async () => {
      req.body = { codigo: "VENCIDO" };
      // Fecha en el pasado
      const mockData = { 
        id: 1, 
        activo: true, 
        fecha_expiracion: "2000-01-01", 
        descuento_porcentaje: 10 
      };
      
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Este cupón ha expirado." });
    });

    test("Se valida correctamente un cupón con fecha futura (vigente)", async () => {
      req.body = { codigo: "VIGENTE" };
      // Fecha en el futuro lejano
      const mockData = { 
        id: 1, 
        activo: true, 
        fecha_expiracion: "2099-12-31", 
        descuento_porcentaje: 20 
      };
      
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        mensaje: "Cupón aplicado.",
        descuento: 20
      }));
    });

    test("Se valida correctamente un cupón sin fecha de expiración (siempre vigente)", async () => {
      req.body = { codigo: "FOREVER" };
      // Sin fecha de expiración
      const mockData = { 
        id: 2, 
        activo: true, 
        fecha_expiracion: null, 
        descuento_porcentaje: 15 
      };
      
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        descuento: 15
      }));
    });

    test("Se maneja error inesperado al validar", async () => {
      req.body = { codigo: "CRASH" };
      supabase.from.mockImplementation(() => { throw new Error("Crash"); });

      await validarCupon(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});