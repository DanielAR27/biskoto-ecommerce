const {
  getMiPerfil,
  actualizarPerfil,
  adminActualizarPerfil,
  listarPerfiles,
} = require("../../../src/controllers/perfilController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase
jest.mock("../../../src/config/supabase", () => ({
  from: jest.fn(),
}));

describe("PerfilController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  // Utilidad para construir mocks encadenables de Supabase
  const createMockQueryBuilder = (mockResponse = { data: [], error: null }) => {
    return {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      then: jest.fn((resolve) => resolve(mockResponse)),
    };
  };

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Se inicializa el usuario simulado para las rutas protegidas
    req = { 
      body: {}, 
      params: {}, 
      user: { id: "user-123" } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  /**
   * SECCIÓN: OBTENER MI PERFIL
   */
  describe("getMiPerfil", () => {
    test("Se obtiene el perfil del usuario autenticado correctamente", async () => {
      const mockData = { id: "user-123", nombre: "Test" };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await getMiPerfil(req, res);

      expect(builder.select).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se maneja error al obtener el perfil", async () => {
      const builder = createMockQueryBuilder({ data: null, error: { message: "DB Error" } });
      supabase.from.mockReturnValue(builder);

      await getMiPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "No se pudo obtener la información del perfil." });
    });
  });

  /**
   * SECCIÓN: ACTUALIZAR PERFIL (Usuario Final)
   */
  describe("actualizarPerfil", () => {
    const validBody = {
      nombre: "Juan",
      apellido: "Perez",
      telefono: "88888888",
      direccion: "Calle 1"
    };

    test("Se valida que el nombre no esté vacío", async () => {
      req.body = { ...validBody, nombre: "" };
      await actualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El nombre no puede estar vacío." });
    });

    test("Se valida que el apellido no esté vacío", async () => {
      req.body = { ...validBody, apellido: "" };
      await actualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El apellido no puede estar vacío." });
    });

    test("Se valida que el teléfono esté presente", async () => {
      req.body = { ...validBody, telefono: "" };
      await actualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El teléfono debe ser un número válido de 8 dígitos." });
    });

    test("Se valida el formato del teléfono (8 dígitos)", async () => {
      req.body = { ...validBody, telefono: "123" }; // Incompleto
      await actualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { ...validBody, telefono: "abcdefgh" }; // Letras
      await actualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Se actualiza el perfil correctamente con dirección (trimming)", async () => {
      // Se envía el teléfono limpio '88888888' porque la validación regex falla si lleva espacios.
      // Además, se mantienen espacios en los otros campos para probar el .trim()
      req.body = { 
        nombre: " Juan ", 
        apellido: " Perez ", 
        telefono: "88888888", 
        direccion: "  Calle Real  " 
      };

      const mockData = { id: "user-123", nombre: "Juan" };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await actualizarPerfil(req, res);

      // Se verifica que se limpiaron los espacios (trim)
      expect(builder.update).toHaveBeenCalledWith({
        nombre: "Juan",
        apellido: "Perez",
        telefono: "88888888",
        direccion: "Calle Real"
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Perfil actualizado correctamente." }));
    });

    test("Se maneja actualización con dirección nula o vacía (Branch Coverage)", async () => {
      req.body = { 
        nombre: "Juan", 
        apellido: "Perez", 
        telefono: "88888888", 
        direccion: null 
      };

      const builder = createMockQueryBuilder({ data: {}, error: null });
      supabase.from.mockReturnValue(builder);

      await actualizarPerfil(req, res);

      // Se verifica que direccion se envió como null
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
        direccion: null
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se maneja error de base de datos al actualizar", async () => {
      req.body = validBody;
      const builder = createMockQueryBuilder({ data: null, error: { message: "Update Fail" } });
      supabase.from.mockReturnValue(builder);

      await actualizarPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al intentar actualizar los datos." });
    });
  });

  /**
   * SECCIÓN: ACTUALIZAR PERFIL (Admin)
   */
  describe("adminActualizarPerfil", () => {
    test("Se valida que el ID sea requerido", async () => {
      req.params.id = undefined;
      await adminActualizarPerfil(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "ID de usuario requerido." });
    });

    test("Se actualiza el perfil por administración exitosamente", async () => {
      req.params.id = "target-user";
      req.body = { rol: "admin", nombre: "Nuevo", apellido: "Admin" };

      const mockData = { id: "target-user", rol: "admin" };
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await adminActualizarPerfil(req, res);

      expect(builder.update).toHaveBeenCalledWith({
        rol: "admin",
        nombre: "Nuevo",
        apellido: "Admin"
      });
      expect(builder.eq).toHaveBeenCalledWith("id", "target-user");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        mensaje: "Perfil de usuario actualizado por administración." 
      }));
    });

    test("Se maneja error de base de datos en actualización administrativa", async () => {
      req.params.id = "target-user";
      const builder = createMockQueryBuilder({ data: null, error: { message: "DB Error" } });
      supabase.from.mockReturnValue(builder);

      await adminActualizarPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
  });

  /**
   * SECCIÓN: LISTAR PERFILES (Admin)
   */
  describe("listarPerfiles", () => {
    test("Se listan los perfiles ordenados por fecha de creación", async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      const builder = createMockQueryBuilder({ data: mockData, error: null });
      supabase.from.mockReturnValue(builder);

      await listarPerfiles(req, res);

      expect(builder.select).toHaveBeenCalledWith(expect.stringContaining("id, nombre, apellido"));
      expect(builder.order).toHaveBeenCalledWith("fecha_creacion", { ascending: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Se maneja error al listar perfiles", async () => {
      const builder = createMockQueryBuilder({ data: null, error: { message: "Fail" } });
      supabase.from.mockReturnValue(builder);

      await listarPerfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al listar los usuarios." });
    });
  });
});