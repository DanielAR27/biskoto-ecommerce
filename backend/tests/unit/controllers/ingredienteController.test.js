const { 
  listarIngredientes,
  obtenerIngrediente,
  crearIngrediente, 
  actualizarIngrediente,
  eliminarIngrediente 
} = require('../../../src/controllers/ingredienteController');
const supabase = require('../../../src/config/supabase');

// Simular el cliente de Supabase para interceptar las llamadas a la base de datos
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn()
}));

describe('IngredienteController - Pruebas Unitarias de Cobertura Completa', () => {
  let req, res;

  beforeAll(() => {
    // Silenciar console.error para mantener la limpieza de la terminal durante las pruebas de error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar el comportamiento original de la consola
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Reiniciar estados de los mocks y definir objetos de transferencia de datos
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('listarIngredientes', () => {
    test('Retornar listado exitoso de ingredientes con estatus 200', async () => {
      const mockData = [{ id: 1, nombre: 'Harina' }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await listarIngredientes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Ejecutar bloque catch al detectar un error en la consulta', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      });

      await listarIngredientes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerIngrediente', () => {
    test('Retornar ingrediente individual cuando el ID es válido', async () => {
      req.params.id = 1;
      const mockData = { id: 1, nombre: 'Sal' };
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await obtenerIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Retornar estatus 404 cuando no se encuentra el registro o hay error', async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });

      await obtenerIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Ejecutar bloque catch ante un fallo inesperado en la búsqueda', async () => {
      req.params.id = 1;
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await obtenerIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearIngrediente', () => {
    test('Validar que el nombre no sea nulo o demasiado corto', async () => {
      req.body = { nombre: ' ' };
      await crearIngrediente(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Validar la presencia obligatoria de unidad_id', async () => {
      req.body = { nombre: 'Azúcar' };
      await crearIngrediente(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Gestionar error de duplicidad de nombre con código 23505', async () => {
      req.body = { nombre: 'Harina', unidad_id: 1 };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: '23505' } })
      });

      await crearIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Ya existe un ingrediente con ese nombre.' }));
    });

    test('Relanzar errores genéricos de base de datos hacia el bloque catch', async () => {
      req.body = { nombre: 'Harina', unidad_id: 1 };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: '99999' } })
      });

      await crearIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Confirmar creación exitosa de un nuevo ingrediente', async () => {
      req.body = { nombre: 'Leche', unidad_id: 1, es_ilimitado: true };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
      });

      await crearIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('actualizarIngrediente', () => {
    test('Confirmar actualización correcta de datos', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Agua' };
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      });

      await actualizarIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Ejecutar bloque catch ante error en actualización', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { message: 'Fail' } })
      });

      await actualizarIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('eliminarIngrediente', () => {
    test('Gestionar error de integridad referencial con código 23503', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { code: '23503' } })
      });

      await eliminarIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Relanzar errores desconocidos hacia el bloque catch global', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { code: 'OTHER' } })
      });

      await eliminarIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Confirmar eliminación exitosa del registro', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await eliminarIngrediente(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});