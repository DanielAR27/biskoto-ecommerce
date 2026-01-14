const {
  listarComentariosPorNoticia,
  listarTodosComentarios,
  crearComentario,
  actualizarComentario,
  eliminarComentario,
  aprobarComentario,
  rechazarComentario,
} = require('../../../src/controllers/comentariosController');
const supabase = require('../../../src/config/supabase');

// Simular el cliente de Supabase para interceptar las llamadas a la base de datos
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn(),
}));

describe("ComentariosController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  beforeAll(() => {
    // Silenciar console.error para mantener la limpieza de la terminal durante las pruebas de error
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar el comportamiento original de la consola
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Reiniciar estados de los mocks y definir objetos de transferencia de datos
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

    describe("listarComentariosPorNoticia", () => {
        test("Listar comentarios aprobados para usuario público incluyendo datos de perfil", async () => {
        req.params.noticiaId = "10";
        req.user = undefined; // Usuario no logueado/no admin

        const mockComentarios = [
            { id: 1, usuario_id: "user1", contenido: "Buen post", estado: "aprobado" },
        ];
        const mockPerfil = { nombre: "Juan", apellido: "Perez", email: "juan@test.com" };

        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ data: mockComentarios, error: null })),
        };

        // Configurar mock para manejar múltiples llamadas
        supabase.from.mockImplementation((tabla) => {
            if (tabla === "comentarios") {
            return mockQueryBuilder;
            }
            if (tabla === "perfiles") {
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockPerfil, error: null }),
            };
            }
        });

        await listarComentariosPorNoticia(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { ...mockComentarios[0], perfiles: mockPerfil },
        ]);
        });

        test("Listar todos los comentarios (incluyendo no aprobados) para administrador", async () => {
        req.params.noticiaId = "10";
        req.user = { rol: "admin" }; // Usuario admin

        const mockComentarios = [{ id: 1, estado: "pendiente" }];
        
        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ data: mockComentarios, error: null })),
        };
        
        supabase.from.mockImplementation((tabla) => {
            if (tabla === 'perfiles') return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: {} }) };
            if (tabla === 'comentarios') return mockQueryBuilder;
        });

        await listarComentariosPorNoticia(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Manejar usuario desconocido cuando no se encuentra perfil", async () => {
        req.params.noticiaId = "10";
        // al ser undefined entra en el if de !admin y requiere el mockQueryBuilder "thenable"
        req.user = undefined; 
        
        const mockComentarios = [{ id: 1, usuario_id: "userX" }];

        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ data: mockComentarios, error: null })),
        };

        supabase.from.mockImplementation((tabla) => {
            if (tabla === "comentarios") {
            return mockQueryBuilder;
            }
            if (tabla === "perfiles") {
            // Simular que no devuelve data (null)
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null }),
            };
            }
        });

        await listarComentariosPorNoticia(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
            expect.objectContaining({
                perfiles: { nombre: "Usuario", apellido: "Desconocido" },
            }),
            ])
        );
    });

    test("Ejecutar bloque catch al detectar un error en la consulta inicial", async () => {
      req.params.noticiaId = "10";
      
      // Simular error también usando el patrón thenable para evitar crash antes del error real
      const mockQueryBuilderError = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: { message: "DB Error" } })),
      };

      supabase.from.mockReturnValue(mockQueryBuilderError);

      await listarComentariosPorNoticia(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener los comentarios" });
    });
  });

  describe("listarTodosComentarios", () => {
    test("Retornar listado completo de comentarios para admin con estatus 200", async () => {
      const mockData = [{ id: 1, contenido: "Test" }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      await listarTodosComentarios(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("Capturar error de base de datos y retornar 500", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: "Fail" } }),
      });

      await listarTodosComentarios(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("crearComentario", () => {
    beforeEach(() => {
        req.user = { id: "user123" };
    });

    test("Validar campos obligatorios faltantes o vacíos", async () => {
      req.body = { noticia_id: "", contenido: "   " };
      await crearComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Noticia y contenido son obligatorios" });
    });

    test("Retornar error 404 si la noticia no existe", async () => {
      req.body = { noticia_id: 1, contenido: "Hola" };
      
      // Simular búsqueda de noticia fallida
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      });

      await crearComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Noticia no encontrada" });
    });

    test("Confirmar creación exitosa del comentario", async () => {
      req.body = { noticia_id: 1, contenido: "Excelente noticia" };
      
      // Configurar mocks secuenciales: primero busca noticia, luego inserta comentario
      const mockSelectNoticia = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      };

      const mockInsertComentario = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 100, estado: "aprobado" }, error: null }),
      };

      supabase.from
        .mockReturnValueOnce(mockSelectNoticia) // Llamada a 'noticias'
        .mockReturnValueOnce(mockInsertComentario); // Llamada a 'comentarios'

      await crearComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Comentario publicado exitosamente." }));
    });

    test("Manejar error en la inserción del comentario", async () => {
      req.body = { noticia_id: 1, contenido: "Hola" };

      // Noticia existe, pero falla insert
      supabase.from
        .mockReturnValueOnce({ // noticias
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        })
        .mockReturnValueOnce({ // comentarios
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: "Insert fail" } }),
        });

      await crearComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("actualizarComentario", () => {
    beforeEach(() => {
        req.user = { id: "user123" };
        req.params.id = "50";
    });

    test("Validar contenido vacío en actualización", async () => {
      req.body = { contenido: "  " };
      await actualizarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Retornar 404 si el comentario no existe", async () => {
      req.body = { contenido: "Editado" };
      
      // Fallo al buscar comentario
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      });

      await actualizarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Retornar 403 si el usuario no es dueño del comentario", async () => {
      req.body = { contenido: "Editado" };
      
      // Comentario existe pero tiene otro usuario_id
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { usuario_id: "otherUser" }, error: null }),
      });

      await actualizarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("Confirmar actualización exitosa por el propietario", async () => {
      req.body = { contenido: "Contenido nuevo" };
      
      // 1. Búsqueda exitosa (es dueño)
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { usuario_id: "user123" }, error: null }),
      };

      // 2. Update exitoso
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 50, contenido: "Contenido nuevo" }, error: null }),
      };

      supabase.from
        .mockReturnValueOnce(mockFind)
        .mockReturnValueOnce(mockUpdate);

      await actualizarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Comentario actualizado. Será revisado nuevamente." }));
    });

    test("Manejar error en la operación de actualización", async () => {
      req.body = { contenido: "Valid" };
      
      // Es dueño, pero falla update
      supabase.from
        .mockReturnValueOnce({ // Select
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { usuario_id: "user123" }, error: null }),
        })
        .mockReturnValueOnce({ // Update
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ error: { message: "Update Error" } }),
        });

      await actualizarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("eliminarComentario", () => {
    beforeEach(() => {
        req.user = { id: "user123", rol: "usuario" };
        req.params.id = "50";
    });

    test("Retornar 404 si el comentario a eliminar no existe", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { message: "Not found" } }),
      });

      await eliminarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Retornar 403 si usuario regular intenta borrar comentario ajeno", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { usuario_id: "otherUser" }, error: null }),
      });

      await eliminarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("Permitir eliminación si el usuario es Admin (incluso si no es dueño)", async () => {
      req.user.rol = "admin";
      
      // 1. Encuentra comentario de otro usuario
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { usuario_id: "otherUser" }, error: null }),
      };

      // 2. Elimina
      const mockDelete = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      supabase.from
        .mockReturnValueOnce(mockFind)
        .mockReturnValueOnce(mockDelete);

      await eliminarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Permitir eliminación si el usuario es el dueño", async () => {
       // 1. Encuentra comentario propio
       const mockFind = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { usuario_id: "user123" }, error: null }),
      };

      // 2. Elimina
      const mockDelete = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      supabase.from
        .mockReturnValueOnce(mockFind)
        .mockReturnValueOnce(mockDelete);

      await eliminarComentario(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Manejar error durante la eliminación en BD", async () => {
        supabase.from
        .mockReturnValueOnce({ // Select success
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { usuario_id: "user123" }, error: null }),
        })
        .mockReturnValueOnce({ // Delete fail
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: { message: "Delete error" } }),
        });

        await eliminarComentario(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("aprobarComentario", () => {
    test("Confirmar aprobación exitosa de comentario", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1, estado: "aprobado" }, error: null }),
      });

      await aprobarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Comentario aprobado exitosamente" }));
    });

    test("Manejar error específico PGRST116 (registro no encontrado)", async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: "PGRST116" } }),
      });

      await aprobarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Comentario no encontrado" });
    });

    test("Relanzar errores genéricos hacia el catch global", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: "OTHER" } }),
      });

      await aprobarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("rechazarComentario", () => {
    test("Confirmar rechazo exitoso de comentario", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1, estado: "rechazado" }, error: null }),
      });

      await rechazarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: "Comentario rechazado" }));
    });

    test("Manejar error específico PGRST116 cuando no existe el comentario", async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: "PGRST116" } }),
      });

      await rechazarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Gestionar fallos generales de base de datos con estatus 500", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: "DB_FAIL" } }),
      });

      await rechazarComentario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});