const {
  listarProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
} = require('../../../src/controllers/proveedorController');
const supabase = require('../../../src/config/supabase');

// Se simula el cliente de Supabase
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn()
}));

describe('ProveedorController - Suite de Pruebas Definitiva (100% Cobertura)', () => {
  let req, res;

  beforeAll(() => {
    // Se silencian los errores de consola para mantener limpia la salida de las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Se restaura el comportamiento original de la consola
    console.error.mockRestore();
  });

  beforeEach(() => {
    // 1. Se limpia el historial de llamadas de los mocks
    jest.clearAllMocks();

    // 2. Se resetea la implementación del mock de Supabase para evitar contaminación entre pruebas
    supabase.from.mockReset();

    // 3. Se definen los objetos básicos de Express con los campos esperados por el controlador
    req = { 
      params: {}, 
      body: {}, 
      query: {},
      user: { id: 'admin-test-id' } // Se añade usuario por si algún middleware o log lo requiere
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // --------------------------------------------------------------------------------
  // 1. LISTAR PROVEEDORES
  // --------------------------------------------------------------------------------
  describe('listarProveedores', () => {
    test('Debe retornar la lista de proveedores ordenada por ID con estatus 200', async () => {
      const mockData = [{ id: 1, nombre: 'Proveedor A' }];
      
      // Se configura el mock para la cadena: from -> select -> order
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await listarProveedores(req, res);

      expect(supabase.from).toHaveBeenCalledWith('proveedores');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Debe capturar error y retornar estatus 500 si falla la consulta', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      });

      await listarProveedores(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/Error al obtener/) }));
    });
  });

  // --------------------------------------------------------------------------------
  // 2. OBTENER PROVEEDOR
  // --------------------------------------------------------------------------------
  describe('obtenerProveedor', () => {
    test('Debe retornar el proveedor solicitado con estatus 200', async () => {
      req.params.id = 1;
      const mockData = { id: 1, nombre: 'Proveedor A' };

      // Se configura el mock para: from -> select -> eq -> single
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await obtenerProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Debe retornar 404 si el proveedor no existe o data es nulo', async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });

      await obtenerProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Proveedor no encontrado.' });
    });

    test('Debe capturar excepción inesperada y retornar 500', async () => {
      req.params.id = 1;
      // Se fuerza un error crítico lanzando una excepción
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await obtenerProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 3. CREAR PROVEEDOR
  // --------------------------------------------------------------------------------
  describe('crearProveedor', () => {
    test('Debe retornar 400 si el nombre no se envía', async () => {
      req.body = { contacto_nombre: 'Juan' }; // Falta 'nombre'
      await crearProveedor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El nombre del proveedor es obligatorio.' });
    });

    test('Debe retornar 400 si ya existe un proveedor con el mismo nombre', async () => {
      req.body = { nombre: 'Existente', contacto_nombre: 'Juan' };

      // Mock 1: Verificación de duplicados (encuentra uno)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
      });

      await crearProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ya existe un proveedor con este nombre.' });
    });

    test('Debe crear el proveedor exitosamente (201) si no hay duplicados', async () => {
      req.body = { 
        nombre: 'Nuevo', 
        contacto_nombre: 'Pepe', 
        telefono: '88888888', 
        email: 'test@mail.com' 
      };

      const proveedorCreado = { id: 2, ...req.body };

      // Mock 1: Verificación de duplicados (no encuentra nada)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      // Mock 2: Inserción exitosa
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [proveedorCreado], error: null })
      });

      await crearProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(proveedorCreado);
    });

    test('Debe retornar 500 si ocurre un error al insertar', async () => {
      req.body = { nombre: 'Error' };

      // Mock 1: Verificación de duplicados (OK)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null })
      });

      // Mock 2: Error en inserción
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert Fail' } })
      });

      await crearProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 4. ACTUALIZAR PROVEEDOR
  // --------------------------------------------------------------------------------
  describe('actualizarProveedor', () => {
    test('Debe retornar 400 si el formato del teléfono es inválido', async () => {
      req.params.id = 1;
      // Teléfono con letras o longitud incorrecta dispara la validación regex
      req.body = { telefono: 'abc' }; 

      await actualizarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El teléfono debe ser un número válido de 8 dígitos.' });
    });

    test('Debe retornar 400 si el nuevo nombre ya está en uso por otro proveedor', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Duplicado' };

      // Mock: Consulta de existencia excluyendo el ID actual
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }) // Encuentra otro ID
      });

      await actualizarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El nombre ya está en uso por otro proveedor.' });
    });

    test('Debe retornar 404 si el proveedor a actualizar no se encuentra', async () => {
      req.params.id = 99;
      req.body = { nombre: 'Unico' };

      // Mock 1: Verificación de nombre (no duplicado)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null })
      });

      // Mock 2: Update retorna array vacío (no encontró registro para actualizar)
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await actualizarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Proveedor no encontrado.' });
    });

    test('Debe actualizar correctamente si los datos son válidos', async () => {
      req.params.id = 1;
      req.body = { 
        nombre: 'Actualizado', 
        contacto_nombre: 'Nuevo Contacto',
        telefono: '12345678'
      };

      // Mock 1: Verificación de nombre (OK)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null })
      });

      // Mock 2: Update exitoso
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [{ id: 1, ...req.body }], error: null })
      });

      await actualizarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Actualizado' }));
    });

    test('Debe retornar 500 ante un error inesperado durante la actualización', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Error' };

      // Mock 1: Verificación nombre OK
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null })
      });

      // Mock 2: Error en update
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update Fail' } })
      });

      await actualizarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // 5. ELIMINAR PROVEEDOR
  // --------------------------------------------------------------------------------
  describe('eliminarProveedor', () => {
    test('Debe retornar 400 si hay violación de llave foránea (Facturas asociadas)', async () => {
      req.params.id = 1;

      // Mock: Error específico de Postgres 23503
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { code: '23503' } })
      });

      await eliminarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: expect.stringMatching(/tiene facturas registradas/) 
      }));
    });

    test('Debe lanzar error y retornar 500 ante otros fallos de base de datos', async () => {
      req.params.id = 1;

      // Mock: Error genérico
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { code: 'OTHER_ERROR' } })
      });

      await eliminarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe eliminar el proveedor correctamente (200)', async () => {
      req.params.id = 1;

      // Mock: Éxito
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await eliminarProveedor(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Proveedor eliminado correctamente.' });
    });
  });
});