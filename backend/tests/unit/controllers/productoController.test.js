const {
  listarProductosCatalogo,
  listarProductosAdmin,
  obtenerProducto,
  validarDisponibilidadMasiva,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('../../../src/controllers/productoController');
const supabase = require('../../../src/config/supabase');

// Simular el cliente de Supabase y sus servicios de Almacenamiento (Storage)
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      remove: jest.fn()
    }))
  }
}));

describe('ProductoController - Suite de Pruebas de Cobertura Total', () => {
  let req, res;

  beforeAll(() => {
    // Silenciar la consola de errores y advertencias para mantener la terminal limpia
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar el comportamiento original de la consola
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  beforeEach(() => {
    // 1. Limpiar historial de llamadas
    jest.clearAllMocks();
    
    // 2. RESETEAR COMPLETAMENTE los mocks acumulados (crucial para 'supabase.from')
    supabase.from.mockReset(); 
    supabase.storage.from.mockReset();

    // 3. Restaurar la implementación base del Storage (para que no sea undefined)
    supabase.storage.from.mockImplementation(() => ({
      remove: jest.fn()
    }));

    // 4. Reiniciar objetos de Express
    req = { params: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // --------------------------------------------------------------------------------
  // 1. LISTAR PRODUCTOS CATÁLOGO
  // --------------------------------------------------------------------------------
  describe('listarProductosCatalogo', () => {
    test('Debe retornar productos paginados sin filtro de búsqueda (estatus 200)', async () => {
      // Simular query string vacía (usa valores por defecto)
      const mockData = [{ id: 1, nombre: 'Pastel' }];
      const mockCount = 10;

      // Mock de la cadena de consulta
      const mockQueryBuilder = {
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockData, error: null, count: mockCount }),
        ilike: jest.fn().mockReturnThis()
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQueryBuilder)
      });

      await listarProductosCatalogo(req, res);

      expect(supabase.from).toHaveBeenCalledWith('productos');
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 19); // Paginación por defecto (page 1, limit 20)
      expect(mockQueryBuilder.ilike).not.toHaveBeenCalled(); // No se llamó búsqueda
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        productos: mockData,
        totalItems: mockCount,
        totalPaginas: 1
      }));
    });

    test('Debe aplicar filtro ilike cuando existe parámetro de búsqueda (search)', async () => {
      req.query = { page: 2, limit: 10, search: 'Choco' };
      const mockQueryBuilder = {
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        ilike: jest.fn().mockReturnThis()
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQueryBuilder)
      });

      await listarProductosCatalogo(req, res);

      // Verificar cálculo de paginación: (2-1)*10 = 10 hasta 19
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19);
      // Verificar aplicación del filtro
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nombre', '%Choco%');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe capturar error y retornar 500 si falla la consulta', async () => {
      const mockQueryBuilder = {
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      };
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQueryBuilder)
      });

      await listarProductosCatalogo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener el catálogo completo.' });
    });
  });

  // --------------------------------------------------------------------------------
  // 2. LISTAR PRODUCTOS ADMIN
  // --------------------------------------------------------------------------------
  describe('listarProductosAdmin', () => {
    test('Debe retornar la lista administrativa con estatus 200', async () => {
      const mockData = [{ id: 1 }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await listarProductosAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Debe capturar error y retornar 500 si falla la consulta', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fail' } })
      });

      await listarProductosAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 3. OBTENER UN PRODUCTO
  // --------------------------------------------------------------------------------
  describe('obtenerProducto', () => {
    test('Debe retornar el detalle del producto con estatus 200', async () => {
      req.params.id = 1;
      const mockProduct = { id: 1, nombre: 'Tarta' };
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null })
      });

      await obtenerProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test('Debe retornar 404 si el producto no existe o hay error de búsqueda', async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });

      await obtenerProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Producto no encontrado.' });
    });

    test('Debe capturar excepción inesperada y retornar 500', async () => {
      req.params.id = 1;
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await obtenerProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 4. VALIDAR DISPONIBILIDAD MASIVA (LÓGICA COMPLEJA)
  // --------------------------------------------------------------------------------
  describe('validarDisponibilidadMasiva', () => {
    test('Debe retornar 400 si la lista de items está vacía o es inválida', async () => {
      req.body.items = [];
      await validarDisponibilidadMasiva(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body.items = null;
      await validarDisponibilidadMasiva(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debe calcular disponibilidad real y detectar conflictos de stock', async () => {
      req.body.items = [{ id: 100, cantidad: 10 }]; // El usuario pide 10

      // Simulamos la respuesta de la base de datos con las recetas
      // Producto 100: Stock físico 20.
      // Receta: Usa Ingrediente A (Stock 50, requiere 5 por unidad) -> Puede hacer 10.
      //         Usa Ingrediente B (Stock 8, requiere 2 por unidad)  -> Puede hacer 4 (LIMITANTE).
      const mockRecetas = [
        {
          producto_id: 100,
          ingrediente_id: 1,
          cantidad_necesaria: 5,
          productos: { id: 100, nombre: 'Pastel', stock_actual: 20 },
          ingredientes: { id: 1, nombre: 'Harina', stock_actual: 50, es_ilimitado: false }
        },
        {
          producto_id: 100,
          ingrediente_id: 2,
          cantidad_necesaria: 2,
          productos: { id: 100, nombre: 'Pastel', stock_actual: 20 },
          ingredientes: { id: 2, nombre: 'Huevo', stock_actual: 8, es_ilimitado: false }
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockRecetas, error: null })
      });

      await validarDisponibilidadMasiva(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // El reactivo limitante es el Huevo (max 4). El usuario pide 10.
      // Debe haber conflicto y la disponibilidad real debe ser 4.
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        valido: false,
        conflictos: expect.arrayContaining([
          expect.objectContaining({ cantidadDisponible: 4 })
        ]),
        disponibilidadReal: { '100': 4 }
      }));
    });

    test('Debe ignorar ingredientes ilimitados y manejar productos sin ingredientes', async () => {
      req.body.items = [{ id: 200, cantidad: 5 }];

      // Producto 200: Stock 50. Ingrediente único ilimitado.
      const mockRecetas = [{
        producto_id: 200,
        ingrediente_id: 3,
        cantidad_necesaria: 1,
        productos: { id: 200, nombre: 'Agua', stock_actual: 50 },
        ingredientes: { id: 3, nombre: 'Agua Grifo', stock_actual: 0, es_ilimitado: true }
      }];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockRecetas, error: null })
      });

      await validarDisponibilidadMasiva(req, res);

      // Disponibilidad limitada solo por el producto (50). Pide 5. Válido.
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        valido: true,
        disponibilidadReal: { '200': 50 }
      }));
    });
    
    test('Debe manejar el caso donde el producto no se encuentra en la DB', async () => {
      req.body.items = [{ id: 999, cantidad: 1 }];
      
      // La consulta devuelve vacío (producto no existe o no tiene receta)
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await validarDisponibilidadMasiva(req, res);

      // Si no hay datos, el bucle forEach de ids no encuentra 'producto' en infoProductos y retorna.
      // No debería explotar.
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe capturar error de base de datos y retornar 500', async () => {
      req.body.items = [{ id: 1, cantidad: 1 }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Fail' } })
      });

      await validarDisponibilidadMasiva(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 5. CREAR PRODUCTO
  // --------------------------------------------------------------------------------
  describe('crearProducto', () => {
    // Validaciones
    test('Debe retornar 400 si el nombre es inválido', async () => {
      req.body = { nombre: 'A' };
      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/nombre/) }));
    });

    test('Debe retornar 400 si el precio es negativo', async () => {
      req.body = { nombre: 'Pan', precio: -10 };
      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/precio/) }));
    });

    test('Debe retornar 400 si el stock es negativo', async () => {
      req.body = { nombre: 'Pan', precio: 10, stock_actual: -5 };
      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/stock no puede ser negativo/) }));
    });

    test('Debe retornar 400 si el stock excede el límite', async () => {
      req.body = { nombre: 'Pan', precio: 10, stock_actual: 1000000 };
      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/demasiado grande/) }));
    });

    // Éxito
    test('Debe crear producto, imágenes e ingredientes correctamente (201)', async () => {
      req.body = {
        nombre: 'Torta', precio: 100, stock_actual: 10,
        imagenes: [{ url: 'http://img.com/1.jpg', es_principal: true }],
        ingredientes: [{ id: 1, cantidad: 200 }]
      };

      const mockNewProduct = { id: 50, nombre: 'Torta' };

      // Mock 1: Insertar producto
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockNewProduct, error: null })
      });

      // Mock 2: Insertar imágenes (no retorna nada específico en el código)
      supabase.from.mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({}) });

      // Mock 3: Insertar ingredientes
      supabase.from.mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) });

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ producto: mockNewProduct }));
    });

    // Errores
    test('Debe retornar 500 si falla la inserción del producto', async () => {
      req.body = { nombre: 'Error', precio: 10, stock_actual: 0 };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert Fail' } })
      });

      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe retornar 500 si falla la inserción de ingredientes', async () => {
      req.body = {
        nombre: 'Torta', precio: 100,
        ingredientes: [{ id: 1, cantidad: 200 }]
      };
      
      // Mock producto OK
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
      });

      // Mock ingredientes Fail
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: { message: 'Recipe Fail' } })
      });

      await crearProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 6. ACTUALIZAR PRODUCTO
  // --------------------------------------------------------------------------------
  describe('actualizarProducto', () => {
    // Validaciones (similares a crear)
    test('Debe validar nombre, precio y stock antes de actualizar', async () => {
      req.params.id = 1;
      req.body = { nombre: '' }; // Nombre inválido
      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { nombre: 'Ok', precio: -1 };
      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { nombre: 'Ok', precio: 10, stock_actual: -1 };
      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { nombre: 'Ok', precio: 10, stock_actual: 1000000 };
      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debe actualizar producto y manejar borrado físico de imágenes obsoletas', async () => {
      req.params.id = 1;
      req.body = {
        nombre: 'Editado', precio: 50, stock_actual: 5,
        imagenes: [{ url: 'http://img.com/nueva.jpg' }], // La vieja no está aquí
        ingredientes: [{ id: 2, cantidad: 50 }]
      };

      // 1. Mock Obtener imágenes viejas
      const imagenesViejas = [{ url: 'http://bucket/vieja.jpg' }];
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: imagenesViejas, error: null })
      });

      // 2. Mock Borrado Físico (Storage) - Simulamos advertencia pero no fallo crítico
      const mockRemove = jest.fn().mockResolvedValue({ error: { message: 'Warn' } });
      supabase.storage.from.mockReturnValue({ remove: mockRemove });

      // 3. Mock Update Datos Básicos
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({})
      });

      // 4. Mock Delete Imágenes Viejas (Tabla)
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({})
      });

      // 5. Mock Insert Imágenes Nuevas
      supabase.from.mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({}) });

      // 6. Mock Delete Receta Vieja
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({})
      });

      // 7. Mock Insert Receta Nueva
      supabase.from.mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) });

      await actualizarProducto(req, res);

      // Verificamos que se intentó borrar el archivo físico "vieja.jpg"
      expect(mockRemove).toHaveBeenCalledWith(['vieja.jpg']);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar 500 si falla la obtención de imágenes actuales', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Test', precio: 10, stock_actual: 1, imagenes: [] };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Get Img Error' } })
      });

      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe retornar 500 si falla la inserción de la nueva receta', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Test', precio: 10, stock_actual: 1, ingredientes: [{ id: 1 }] };

      // Mock Get Img OK
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      // Mocks intermedios (Update prod, Delete img, Insert img (skipped), Delete recipe)
      supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnThis(), eq: jest.fn() });
      supabase.from.mockReturnValueOnce({ delete: jest.fn().mockReturnThis(), eq: jest.fn() });
      supabase.from.mockReturnValueOnce({ delete: jest.fn().mockReturnThis(), eq: jest.fn() });

      // Mock Insert Receta FAIL
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: { message: 'Recipe Error' } })
      });

      await actualizarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 7. ELIMINAR PRODUCTO
  // --------------------------------------------------------------------------------
  describe('eliminarProducto', () => {
    test('Debe eliminar producto, imágenes físicas y registros en cascada (200)', async () => {
      req.params.id = 1;
      const imagenesAsociadas = [{ url: 'http://bucket/foto1.jpg' }];

      // 1. Obtener imágenes
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: imagenesAsociadas, error: null })
      });

      // 2. Borrar físico
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      supabase.storage.from.mockReturnValue({ remove: mockRemove });

      // 3. Borrar DB
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await eliminarProducto(req, res);

      expect(mockRemove).toHaveBeenCalledWith(['foto1.jpg']);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe capturar error al consultar imágenes y retornar 500', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB Error' } })
      });

      await eliminarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe capturar error al eliminar el registro en la DB y retornar 500', async () => {
      req.params.id = 1;

      // Mock Get Img OK (vacío)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      // Mock Delete DB Fail
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete Fail' } })
      });

      await eliminarProducto(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});