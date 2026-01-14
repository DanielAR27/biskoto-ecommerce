const {
  crearPedido,
  confirmarPago,
  listarMisPedidos,
  obtenerPedido,
  listarTodosPedidos,
  actualizarEstadoPedido,
  cancelarPedido,
  eliminarPedido,
  actualizarPedido,
} = require("../../../src/controllers/pedidosController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase
jest.mock("../../../src/config/supabase", () => ({
  from: jest.fn(),
}));

describe("PedidosController - Pruebas Unitarias de Cobertura Completa", () => {
  let req, res;

  // Utilidad "Builder" para mocks encadenables de Supabase
  const createMockQueryBuilder = (mockResponse = { data: [], error: null }) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      // 'then' permite usar await directamente sobre el builder
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
    req = { body: {}, params: {}, user: { id: "user-123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  /**
   * SECCIÓN: CREAR PEDIDO
   */
  describe("crearPedido", () => {
    test("Se valida que el pedido tenga items y datos de entrega", async () => {
      req.body = { items: [] }; // Items vacíos
      await crearPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/al menos un producto/) }));

      req.body = { items: [{ id: 1, cantidad: 1 }], datos_entrega: {} }; // Falta info entrega
      await crearPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/datos de entrega son obligatorios/) }));
    });

    test("Se rechaza el pedido si el stock es insuficiente (por ingrediente limitante)", async () => {
      req.body = {
        items: [{ id: 101, cantidad: 10 }],
        datos_entrega: { telefono: "888", direccion: "Casa" },
      };

      // Mock de Recetas: El producto tiene stock 20, pero el ingrediente solo permite fabricar 5
      const mockRecetas = [
        {
          producto_id: 101,
          ingrediente_id: 1,
          cantidad_necesaria: 2,
          productos: { id: 101, nombre: "Pastel", stock_actual: 20, precio: 1000 },
          ingredientes: { id: 1, stock_actual: 10, es_ilimitado: false }, // 10 / 2 = 5 fabricables
        },
      ];

      supabase.from.mockReturnValue(createMockQueryBuilder({ data: mockRecetas, error: null }));

      await crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "Stock insuficiente para algunos productos",
        conflictos: expect.arrayContaining([
          expect.objectContaining({ cantidadDisponible: 5, cantidadSolicitada: 10 })
        ])
      }));
    });

    test("Se rechaza si un producto no existe en la base de datos", async () => {
      req.body = {
        items: [{ id: 999, cantidad: 1 }],
        datos_entrega: { telefono: "888", direccion: "Casa" },
      };

      // Recetas vacías -> Producto no encontrado
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: [], error: null }));

      await crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        conflictos: expect.arrayContaining([expect.objectContaining({ error: "Producto no encontrado" })])
      }));
    });

    test("Se valida cupón inválido o inactivo", async () => {
      req.body = {
        items: [{ id: 101, cantidad: 1 }],
        datos_entrega: { telefono: "888", direccion: "Dir" },
        cupon_id: 50,
      };

      const mockRecetas = [{
        producto_id: 101, ingrediente_id: 1, cantidad_necesaria: 1,
        productos: { id: 101, nombre: "Pan", stock_actual: 10, precio: 100 },
        ingredientes: { id: 1, stock_actual: 100, es_ilimitado: true }
      }];

      const mockCuponQuery = createMockQueryBuilder({ data: null, error: { message: "Not found" } });

      supabase.from.mockImplementation((table) => {
        if (table === "producto_ingredientes") return createMockQueryBuilder({ data: mockRecetas, error: null });
        if (table === "cupones") return mockCuponQuery;
      });

      await crearPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Cupón inválido o inactivo" });
    });

    test("Se valida cupón expirado", async () => {
      req.body = {
        items: [{ id: 101, cantidad: 1 }],
        datos_entrega: { telefono: "888", direccion: "Dir" },
        cupon_id: 50,
      };

      const mockRecetas = [{
        producto_id: 101, ingrediente_id: 1, cantidad_necesaria: 1,
        productos: { id: 101, nombre: "Pan", stock_actual: 10, precio: 100 },
        ingredientes: { id: 1, stock_actual: 100, es_ilimitado: true }
      }];

      const fechaAyer = new Date();
      fechaAyer.setDate(fechaAyer.getDate() - 1);
      const mockCupon = { id: 50, activo: true, fecha_expiracion: fechaAyer.toISOString().split("T")[0], descuento_porcentaje: 10 };

      supabase.from.mockImplementation((table) => {
        if (table === "producto_ingredientes") return createMockQueryBuilder({ data: mockRecetas });
        if (table === "cupones") return createMockQueryBuilder({ data: mockCupon });
      });

      await crearPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El cupón ha expirado" });
    });

    test("Se crea pedido exitosamente con cupón válido y stock suficiente", async () => {
      req.body = {
        items: [{ id: 101, cantidad: 2 }],
        datos_entrega: { telefono: "888", direccion: "Dir" },
        cupon_id: 50,
      };

      const mockRecetas = [{
        producto_id: 101, ingrediente_id: 1, cantidad_necesaria: 1,
        productos: { id: 101, nombre: "Pan", stock_actual: 10, precio: 100 },
        ingredientes: { id: 1, stock_actual: 100, es_ilimitado: true }
      }];

      const mockCupon = { id: 50, activo: true, fecha_expiracion: "2099-12-31", descuento_porcentaje: 10, codigo: "DESC10" };
      const mockPedidoCreado = { id: 5000 };

      supabase.from.mockImplementation((table) => {
        if (table === "producto_ingredientes") return createMockQueryBuilder({ data: mockRecetas });
        if (table === "cupones") return createMockQueryBuilder({ data: mockCupon });
        if (table === "pedidos") return createMockQueryBuilder({ data: mockPedidoCreado });
        if (table === "detalle_pedidos") return createMockQueryBuilder({ data: null });
      });

      await crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        pedido: expect.objectContaining({ total: 180, numeroReferencia: "BISK-005000" })
      }));
    });

    test("Se maneja error interno durante la creación", async () => {
      // CORRECCIÓN: Se envían datos válidos para pasar las validaciones iniciales
      // y llegar hasta la llamada de BD que fallará.
      req.body = { 
        items: [{ id: 1, cantidad: 1 }], 
        datos_entrega: { telefono: "1", direccion: "Calle 1" } 
      };
      
      supabase.from.mockImplementation(() => { throw new Error("DB Crash"); });
      
      await crearPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: CONFIRMAR PAGO
   */
  describe("confirmarPago", () => {
    test("Se retorna 404 si el pedido no existe", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: null, error: { message: "Not found" } }));
      await confirmarPago(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Se impide confirmar si el estado no es 'Pendiente de Pago' (1)", async () => {
      req.params.id = 1;
      const mockPedido = { id: 1, estado_id: 2, detalle_pedidos: [] };
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: mockPedido }));
      
      await confirmarPago(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Se bloquea la confirmación si el stock cambió y ahora es insuficiente", async () => {
      req.params.id = 1;
      const mockPedido = { id: 1, estado_id: 1, notas: "{}", detalle_pedidos: [{ producto_id: 101, cantidad: 5 }] };
      const mockRecetas = [{
        producto_id: 101, ingrediente_id: 1, cantidad_necesaria: 1,
        productos: { id: 101, nombre: "Pan", stock_actual: 0 },
        ingredientes: { id: 1, stock_actual: 0, es_ilimitado: false }
      }];

      supabase.from.mockImplementation((table) => {
        if (table === "pedidos") return createMockQueryBuilder({ data: mockPedido });
        if (table === "producto_ingredientes") return createMockQueryBuilder({ data: mockRecetas });
      });

      await confirmarPago(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/Stock insuficiente/) }));
    });

    test("Se confirma el pago, descuenta stock y actualiza estado", async () => {
      req.params.id = 1;
      req.body = { comprobante_url: "http://img.com" };

      const mockPedido = { 
        id: 1, 
        estado_id: 1, 
        notas: JSON.stringify({ direccion: "Casa" }), 
        detalle_pedidos: [{ producto_id: 101, cantidad: 2 }] 
      };

      const mockRecetas = [{
        producto_id: 101, ingrediente_id: 50, cantidad_necesaria: 2,
        productos: { id: 101, nombre: "Pan", stock_actual: 10 },
        ingredientes: { id: 50, stock_actual: 100, es_ilimitado: false }
      }];

      const updateSpy = jest.fn().mockReturnThis();

      supabase.from.mockImplementation((table) => {
        if (table === "pedidos") {
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockPedido }),
                update: updateSpy,
                then: jest.fn(r => r({ data: mockPedido }))
            };
        }
        if (table === "producto_ingredientes") return createMockQueryBuilder({ data: mockRecetas });
        if (table === "productos" || table === "ingredientes") return { update: updateSpy, eq: jest.fn().mockReturnThis() };
        return createMockQueryBuilder({});
      });

      await confirmarPago(req, res);

      expect(updateSpy).toHaveBeenCalledWith({ stock_actual: 8 }); // Producto
      expect(updateSpy).toHaveBeenCalledWith({ stock_actual: 96 }); // Ingrediente
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se maneja error en la base de datos durante confirmación", async () => {
      req.params.id = 1;
      supabase.from.mockImplementation(() => { throw new Error("DB Error"); });
      await confirmarPago(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: LISTADOS
   */
describe("listarMisPedidos y listarTodosPedidos", () => {
    test("listarMisPedidos retorna array de pedidos", async () => {
      const mockData = [{ id: 1 }];
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: mockData }));
      await listarMisPedidos(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test("listarTodosPedidos retorna array completo (Admin)", async () => {
      const mockData = [{ id: 1, perfiles: {} }];
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: mockData }));
      await listarTodosPedidos(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // Cubre el catch error de listarTodosPedidos
    test("Maneja error de BD al listar todos los pedidos", async () => {
      const builder = createMockQueryBuilder({
        data: null,
        error: { message: "DB Error" },
      });
      supabase.from.mockReturnValue(builder);

      await listarTodosPedidos(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    test("obtenerPedido retorna detalle si existe", async () => {
      req.params.id = 1;
      const mockData = { id: 1, detalle: [] };
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: mockData }));
      await obtenerPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("obtenerPedido retorna 404 si no encuentra data", async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: null, error: { message: "Not found" } }));
      await obtenerPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Manejo de errores generales en listados (Mis Pedidos)", async () => {
       supabase.from.mockImplementation(() => { throw new Error("Fail"); });
       await listarMisPedidos(req, res);
       expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * SECCIÓN: GESTIÓN DE ESTADOS Y EDICIÓN
   */
describe("actualizarEstadoPedido", () => {
    test("Requiere estado_id obligatorio", async () => {
      req.body = {};
      await actualizarEstadoPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Actualiza estado correctamente", async () => {
      req.params.id = 1;
      req.body = { estado_id: 3 };
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: [], error: null }));
      await actualizarEstadoPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // Cubre la línea del 'throw error' en el update
    test("Maneja error de BD al actualizar estado", async () => {
      req.params.id = 1;
      req.body = { estado_id: 3 };
      
      const builder = createMockQueryBuilder({ 
        data: null, 
        error: { message: "Update Fail" } 
      });
      supabase.from.mockReturnValue(builder);

      await actualizarEstadoPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

describe("cancelarPedido", () => {
    test("Permite cancelar solo pedidos pendientes (estado 1)", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: { estado_id: 1 } }));
      await cancelarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Rechaza cancelar pedido ya procesado", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: { estado_id: 2 } }));
      await cancelarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Retorna 404 si pedido no existe", async () => {
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: null, error: { message: "404" } }));
      await cancelarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    // Cubre el error en la consulta de actualización
    test("Maneja error de BD al ejecutar la cancelación", async () => {
      req.params.id = 1;
      supabase.from
        .mockReturnValueOnce(createMockQueryBuilder({ data: { estado_id: 1 } })) // Select OK
        .mockReturnValueOnce(createMockQueryBuilder({ data: null, error: { message: "Update Fail" } })); // Update Fail
      
      await cancelarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("eliminarPedido", () => {
    test("Permite eliminar pedidos pendientes (1) o cancelados (6)", async () => {
      req.params.id = 1;
      const builder = createMockQueryBuilder({ data: { id: 1, estado_id: 6 } });
      supabase.from.mockReturnValue(builder);

      await eliminarPedido(req, res);
      expect(builder.delete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Impide eliminar pedidos confirmados/en proceso", async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: { id: 1, estado_id: 2 } }));
      await eliminarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Retorna 404 si pedido no existe", async () => {
      supabase.from.mockReturnValue(createMockQueryBuilder({ data: null, error: { message: "Not found" } }));
      await eliminarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    // Cubre el error en la consulta de eliminación
    test("Maneja error de BD al eliminar", async () => {
      req.params.id = 1;
      supabase.from
        .mockReturnValueOnce(createMockQueryBuilder({ data: { id: 1, estado_id: 1 } })) // Select OK
        .mockReturnValueOnce(createMockQueryBuilder({ data: null, error: { message: "Delete Fail" } })); // Delete Fail

      await eliminarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

describe("actualizarPedido", () => {
    test("Retorna 400 si no hay datos válidos para actualizar", async () => {
      req.params.id = "1";
      req.body = {}; // Body vacío
      await actualizarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    // Ahora se prueba 'total' como string y 'cupon_id' para cubrir ramas
    test("Se actualiza total, cupon_id y notas correctamente", async () => {
      req.params.id = 1;
      req.body = { 
        total: "5000.50", // String para forzar parseFloat
        cupon_id: 10,     // Para cubrir rama de cupon
        notas: { nuevaNota: "Info" } 
      };

      const mockPedidoActual = { notas: { notaAntigua: "Original" } };
      const mockUpdateResult = { id: 1, total: 5000.50 };

      // Mock Select Notas
      const mockSelect = createMockQueryBuilder({ data: mockPedidoActual });
      // Mock Update
      const mockUpdate = createMockQueryBuilder({ data: mockUpdateResult });

      supabase.from
        .mockReturnValueOnce(mockSelect)
        .mockReturnValueOnce(mockUpdate);

      await actualizarPedido(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Se verifica que se llamó al update con los datos transformados
      expect(mockUpdate.update).toHaveBeenCalledWith(expect.objectContaining({
          total: 5000.50, // Debe ser numérico
          cupon_id: 10
      }));
    });

    test("Se combinan notas cuando las originales vienen como string JSON", async () => {
      req.params.id = 1;
      req.body = { notas: { nueva: "X" } };
      const mockPedidoActual = { notas: '{"notaAntigua": "Original"}' };
      
      supabase.from
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockPedidoActual }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: {} }));

      await actualizarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Se maneja error PGRST116 (Not Found) en update", async () => {
      req.params.id = 1;
      req.body = { total: 100, notas: { x: 1 } }; 
      
      supabase.from
        .mockReturnValueOnce(createMockQueryBuilder({ data: {} })) 
        .mockReturnValueOnce(createMockQueryBuilder({ data: null, error: { code: "PGRST116" } })); 

      await actualizarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Se maneja error genérico en update", async () => {
      req.params.id = 1;
      req.body = { total: 100 };
      
      supabase.from.mockImplementation(() => { throw new Error("DB Fail"); });
      
      await actualizarPedido(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});