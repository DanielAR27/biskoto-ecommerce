const { 
  listarCategorias,
  obtenerCategoria,
  crearCategoria, 
  actualizarCategoria,
  eliminarCategoria 
} = require('../../../src/controllers/categoriaController');
const supabase = require('../../../src/config/supabase');

// Simular el cliente de Supabase para evitar interacciones reales con el servicio
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn()
}));

describe('CategoriaController - Pruebas Unitarias de Cobertura Total', () => {
  let req, res;

  beforeAll(() => {
    // Silenciar console.error para mantener la limpieza de la salida durante las pruebas de fallo
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar el comportamiento original de la consola al finalizar la suite
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Limpiar estados de los mocks y redefinir objetos de Express antes de cada prueba
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('listarCategorias', () => {
    test('Retornar estatus 200 con la lista de categorías cuando la consulta es exitosa', async () => {
      const mockData = [{ id: 1, nombre: 'Panadería' }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await listarCategorias(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Ejecutar el bloque catch y retornar estatus 500 ante un error de Supabase', async () => {
      // Forzar el lanzamiento del error mediante el condicional if (error) throw error
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } })
      });

      await listarCategorias(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener las categorías.' });
    });
  });

  describe('obtenerCategoria', () => {
    test('Retornar la categoría solicitada con estatus 200', async () => {
      req.params.id = 1;
      const mockData = { id: 1, nombre: 'Reposteria' };
      supabase.from.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await obtenerCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Retornar estatus 404 cuando el registro no existe o la consulta falla', async () => {
      req.params.id = 99;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not Found' } })
      });

      await obtenerCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Retornar estatus 500 ante una excepción inesperada en el bloque try', async () => {
      req.params.id = 1;
      // Provocar una excepción directa para cubrir el bloque catch
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await obtenerCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('crearCategoria', () => {
    test('Retornar estatus 400 si el nombre de la categoría es omitido', async () => {
      req.body = { descripcion: 'Prueba sin nombre' };
      await crearCategoria(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Retornar estatus 400 ante un conflicto de duplicidad de nombre (Código 23505)', async () => {
      req.body = { nombre: 'Repostería' };
      // Simular respuesta de error por llave única duplicada en la base de datos
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: '23505' } })
      });

      await crearCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La categoría "Repostería" ya existe.' });
    });

    test('Retornar estatus 201 al registrar una categoría correctamente', async () => {
      req.body = { nombre: 'Nueva' };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 10 }, error: null })
      });

      await crearCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Categoría creada con éxito.' }))
    });

    test('Relanzar error genérico hacia el catch cuando falla la inserción', async () => {
      req.body = { nombre: 'Error' };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: '999' } })
      });

      await crearCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('actualizarCategoria', () => {
    test('Retornar estatus 200 tras una actualización exitosa', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Actualizada' };
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
      });

      await actualizarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Retornar estatus 409 cuando el nombre actualizado ya está en uso (Código 23505)', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Duplicado' };
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: '23505' } })
      });

      await actualizarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('Capturar errores desconocidos en el bloque catch durante la actualización', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: { code: 'OTHER' } })
      });

      await actualizarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('eliminarCategoria', () => {
    test('Retornar estatus 200 al eliminar satisfactoriamente la categoría', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Categoría eliminada correctamente.' });
    });

    test('Ejecutar el relanzamiento de error y caer en el catch ante un fallo de borrado', async () => {
      req.params.id = 1;
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete Error' } })
      });

      await eliminarCategoria(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar la categoría.' });
    });
  });
});