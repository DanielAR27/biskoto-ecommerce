const {
  crearNoticia,
  listarNoticias,
  obtenerNoticia,
  actualizarNoticia,
  eliminarNoticia,
} = require("../../../src/controllers/noticiasController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase
jest.mock("../../../src/config/supabase", () => ({
  from: jest.fn(),
}));

describe("NoticiasController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  // Utilidad "Builder" para mocks encadenables
  const createMockQueryBuilder = (mockResponse = { data: [], error: null }) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      then: jest.fn((resolve) => resolve(mockResponse)),
    };
    return builder;
  };

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("crearNoticia", () => {
    beforeEach(() => {
      req.user = { id: "admin-id", rol: "admin" };
    });

    test("Se valida que el título y el contenido sean obligatorios", async () => {
      req.body = { titulo: "", contenido: "Algo" };
      await crearNoticia(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Título y contenido son obligatorios",
      });
    });

    test("Se confirma la creación de una noticia generando un slug único (sin colisión)", async () => {
      req.body = {
        titulo: "Mi Noticia Nueva",
        contenido: "Contenido test",
        categoria: "tech",
      };

      const mockCheckSlug = createMockQueryBuilder({ data: null, error: null });
      const mockInsert = createMockQueryBuilder({
        data: { id: 1, slug: "mi-noticia-nueva" },
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(mockCheckSlug)
        .mockReturnValueOnce(mockInsert);

      await crearNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Noticia creada exitosamente",
          noticia: expect.objectContaining({ slug: "mi-noticia-nueva" }),
        })
      );
    });

    // Cubre la rama de valores por defecto (categoria || "general") y (activo: false)
    test("Se asignan valores por defecto y se respeta activo=false", async () => {
      req.body = {
        titulo: "Sin Categoria",
        contenido: "Contenido",
        // No enviar categoría (debe ser 'general')
        activo: false, // Enviar false explícito (debe respetarlo)
      };

      const mockCheckSlug = createMockQueryBuilder({ data: null, error: null });
      const mockInsert = createMockQueryBuilder({
        data: { id: 2, categoria: "general", activo: false },
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(mockCheckSlug)
        .mockReturnValueOnce(mockInsert);

      await crearNoticia(req, res);

      const insertCallArgs = mockInsert.insert.mock.calls[0][0];
      // Verifica coverage de la rama 'categoria || "general"'
      expect(insertCallArgs[0].categoria).toBe("general");
      // Verificam coverage de la rama ternaria de activo
      expect(insertCallArgs[0].activo).toBe(false);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("Se maneja la colisión de slugs agregando un timestamp si ya existe", async () => {
      req.body = { titulo: "Noticia Repetida", contenido: "Contenido" };

      const mockCheckSlug = createMockQueryBuilder({
        data: { id: 50 }, // Existe
        error: null,
      });
      const mockInsert = createMockQueryBuilder({
        data: { id: 51, slug: expect.stringContaining("noticia-repetida-") },
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(mockCheckSlug)
        .mockReturnValueOnce(mockInsert);

      await crearNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const insertCallArgs = mockInsert.insert.mock.calls[0][0];
      expect(insertCallArgs[0].slug).toMatch(/noticia-repetida-\d+/);
    });

    test("Se captura error de base de datos durante la creación", async () => {
      req.body = { titulo: "Error DB", contenido: "..." };

      const mockError = createMockQueryBuilder({
        data: null,
        error: { message: "DB Error" },
      });
      supabase.from.mockReturnValue(mockError);

      await crearNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al crear la noticia" });
    });
  });

  describe("listarNoticias", () => {
    test("Se listan solo noticias activas para usuarios públicos", async () => {
      req.user = undefined; // Público
      const mockData = [{ id: 1, activo: true }];
      const builder = createMockQueryBuilder({ data: mockData, error: null });

      supabase.from.mockReturnValue(builder);

      await listarNoticias(req, res);

      expect(builder.eq).toHaveBeenCalledWith("activo", true);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se listan todas las noticias para administradores sin filtro forzado", async () => {
      req.user = { rol: "admin" };
      const mockData = [{ id: 1, activo: false }];
      const builder = createMockQueryBuilder({ data: mockData, error: null });

      supabase.from.mockReturnValue(builder);

      await listarNoticias(req, res);

      // NO se debe llamar a eq("activo", true)
      const calls = builder.eq.mock.calls.map((call) => call[0]);
      expect(calls).not.toContain("activo");
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    // Cubre la rama del filtro explícito siendo admin
    test("Se permite filtrar explícitamente por 'activo=true' siendo admin", async () => {
      req.user = { rol: "admin" };
      req.query = { activo: "true" }; // Query string
      
      const builder = createMockQueryBuilder({ data: [], error: null });
      supabase.from.mockReturnValue(builder);

      await listarNoticias(req, res);

      // Debe entrar al if porque activo === "true"
      expect(builder.eq).toHaveBeenCalledWith("activo", true);
    });

    test("Se filtra por categoría si se proporciona", async () => {
      req.user = { rol: "admin" };
      req.query = { categoria: "deportes" };
      
      const builder = createMockQueryBuilder({ data: [], error: null });
      supabase.from.mockReturnValue(builder);

      await listarNoticias(req, res);

      expect(builder.eq).toHaveBeenCalledWith("categoria", "deportes");
    });

    test("Se gestiona error de base de datos al listar", async () => {
      const builder = createMockQueryBuilder({
        data: null,
        error: { message: "Fail" },
      });
      builder.then = jest.fn((resolve, reject) => resolve({ data: null, error: { message: "Fail" } }));
      
      supabase.from.mockReturnValue(builder);

      await listarNoticias(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("obtenerNoticia", () => {
    test("Se obtiene noticia por ID numérico e incrementa vistas", async () => {
      req.params.id = "100";
      req.user = { rol: "admin" };

      const mockNoticia = { id: 100, vistas: 5 };
      const mockSelect = createMockQueryBuilder({ data: mockNoticia, error: null });
      const mockUpdate = createMockQueryBuilder({ data: null, error: null });

      supabase.from
        .mockReturnValueOnce(mockSelect)
        .mockReturnValueOnce(mockUpdate);

      await obtenerNoticia(req, res);

      expect(mockSelect.eq).toHaveBeenCalledWith("id", 100);
      expect(mockUpdate.update).toHaveBeenCalledWith({ vistas: 6 });
      expect(res.json).toHaveBeenCalledWith(mockNoticia);
    });

    test("Se obtiene noticia por Slug para usuario público", async () => {
      req.params.id = "mi-slug-url";
      req.user = undefined;

      const mockSelect = createMockQueryBuilder({
        data: { id: 1, slug: "mi-slug-url", vistas: 0 },
        error: null,
      });
      const mockUpdate = createMockQueryBuilder();

      supabase.from
        .mockReturnValueOnce(mockSelect)
        .mockReturnValueOnce(mockUpdate);

      await obtenerNoticia(req, res);

      expect(mockSelect.eq).toHaveBeenCalledWith("slug", "mi-slug-url");
      expect(mockSelect.eq).toHaveBeenCalledWith("activo", true);
      expect(res.json).toHaveBeenCalled();
    });

    test("Se retorna 404 si la noticia no existe (PGRST116)", async () => {
      req.params.id = "999";
      const mockSelect = createMockQueryBuilder({
        data: null,
        error: { code: "PGRST116" },
      });

      supabase.from.mockReturnValue(mockSelect);

      await obtenerNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Noticia no encontrada" });
    });

    test("Se maneja error genérico al obtener noticia", async () => {
      req.params.id = "1";
      const mockSelect = createMockQueryBuilder({
        data: null,
        error: { message: "Crash" },
      });

      supabase.from.mockReturnValue(mockSelect);

      await obtenerNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("actualizarNoticia", () => {
    beforeEach(() => {
      req.params.id = "10";
      req.user = { rol: "admin" };
    });

    // Cubre la asignación condicional de todos los campos
    test("Se actualizan múltiples campos simultáneamente", async () => {
      req.body = { 
        contenido: "Nuevo", 
        extracto: "Extracto",
        imagen_url: "http://img.com",
        categoria: "new-cat",
        activo: false
      };

      const mockUpdate = createMockQueryBuilder({
        data: { id: 10, ...req.body },
        error: null,
      });

      supabase.from.mockReturnValue(mockUpdate);

      await actualizarNoticia(req, res);

      expect(mockUpdate.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalled();
    });

    // Cubre la rama donde se cambia título PERO NO hay colisión
    test("Se regenera slug al actualizar título SIN colisión", async () => {
      req.body = { titulo: "Titulo Único" };

      // 1. Check colisión: Retorna null (no existe)
      const mockCheck = createMockQueryBuilder({ data: null, error: null }); 
      
      // 2. Update
      const mockUpdate = createMockQueryBuilder({
        data: { id: 10, titulo: "Titulo Único", slug: "titulo-unico" },
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(mockCheck)
        .mockReturnValueOnce(mockUpdate);

      await actualizarNoticia(req, res);

      // Verifica que buscó excluir el ID propio
      expect(mockCheck.neq).toHaveBeenCalledWith("id", 10);
      
      // Verifica que el slug NO tiene timestamp (no hubo colisión)
      const updateArgs = mockUpdate.update.mock.calls[0][0];
      expect(updateArgs.slug).toBe("titulo-unico");
    });

    test("Se regenera slug al actualizar título CON colisión", async () => {
      req.body = { titulo: "Nuevo Título" };

      // 1. Check colisión: Retorna un objeto (SÍ existe)
      const mockCheck = createMockQueryBuilder({ data: { id: 20 }, error: null }); 
      
      // 2. Update
      const mockUpdate = createMockQueryBuilder({
        data: { id: 10, titulo: "Nuevo Título", slug: "nuevo-titulo-TIMESTAMP" },
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(mockCheck)
        .mockReturnValueOnce(mockUpdate);

      await actualizarNoticia(req, res);

      const updateArgs = mockUpdate.update.mock.calls[0][0];
      // Debe tener timestamp
      expect(updateArgs.slug).toMatch(/nuevo-titulo-\d+/);
    });

    test("Se retorna 404 si se intenta actualizar una noticia inexistente", async () => {
      req.body = { contenido: "x" };
      const mockUpdate = createMockQueryBuilder({
        data: null,
        error: { code: "PGRST116" },
      });

      supabase.from.mockReturnValue(mockUpdate);

      await actualizarNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Se maneja error interno del servidor al actualizar", async () => {
      req.body = { contenido: "x" };
      const mockUpdate = createMockQueryBuilder({
        data: null,
        error: { message: "DB Error" },
      });

      supabase.from.mockReturnValue(mockUpdate);

      await actualizarNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("eliminarNoticia", () => {
    test("Se elimina una noticia exitosamente por ID", async () => {
      req.params.id = "5";

      const mockDelete = createMockQueryBuilder({ data: null, error: null });
      supabase.from.mockReturnValue(mockDelete);

      await eliminarNoticia(req, res);

      expect(mockDelete.delete).toHaveBeenCalled();
      expect(mockDelete.eq).toHaveBeenCalledWith("id", 5);
      expect(res.json).toHaveBeenCalledWith({ message: "Noticia eliminada exitosamente" });
    });

    test("Se maneja error al intentar eliminar", async () => {
      req.params.id = "5";

      const mockDelete = createMockQueryBuilder({
        data: null,
        error: { message: "Error borrando" },
      });
      supabase.from.mockReturnValue(mockDelete);

      await eliminarNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al eliminar la noticia" });
    });
  });
});