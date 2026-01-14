const { generarUrlSubida } = require('../../../src/controllers/storageController');
const { createClient } = require('@supabase/supabase-js');

// Se simula el módulo de Supabase para interceptar la creación del cliente y sus métodos
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('StorageController - Suite de Pruebas de Cobertura Total', () => {
  let req, res;
  let mockStorage;

  beforeAll(() => {
    // Se silencia la consola de errores para mantener la limpieza del reporte de pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Se restaura el comportamiento original de la consola
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Se limpian los mocks antes de cada prueba
    jest.clearAllMocks();

    // Se definen los objetos de petición y respuesta de Express
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Se define la estructura del mock del cliente de Storage
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      createSignedUploadUrl: jest.fn()
    };

    // Se configura createClient para que retorne el cliente simulado
    createClient.mockReturnValue({ storage: mockStorage });
  });

  // --------------------------------------------------------------------------------
  // VALIDACIONES DE ENTRADA
  // --------------------------------------------------------------------------------
  test('Debe retornar estatus 400 si el nombre del archivo (fileName) no es proporcionado', async () => {
    req.body = {}; // Se omite el campo requerido

    await generarUrlSubida(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El nombre del archivo es requerido.' });
  });

  // --------------------------------------------------------------------------------
  // LÓGICA DE SELECCIÓN DE BUCKETS Y ÉXITO
  // --------------------------------------------------------------------------------
  test('Debe seleccionar el bucket "productos" si el nombre no incluye "comprobante-"', async () => {
    req.body = { fileName: 'imagen_pan.jpg' };
    
    mockStorage.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'url_firmada', token: 'abc', path: 'path/123' },
      error: null
    });

    await generarUrlSubida(req, res);

    // Se verifica que se haya llamado al bucket correcto
    expect(mockStorage.from).toHaveBeenCalledWith('productos');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'productos' }));
  });

  test('Debe seleccionar el bucket "comprobantes" si el nombre incluye "comprobante-"', async () => {
    req.body = { fileName: 'comprobante-pago.pdf' };
    
    mockStorage.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'url_firmada', token: 'abc', path: 'path/123' },
      error: null
    });

    await generarUrlSubida(req, res);

    // Se verifica la lógica de ramificación para el bucket de comprobantes
    expect(mockStorage.from).toHaveBeenCalledWith('comprobantes');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'comprobantes' }));
  });

  // --------------------------------------------------------------------------------
  // MANEJO DE ERRORES Y BLOQUES CATCH
  // --------------------------------------------------------------------------------
  test('Debe lanzar un error si la respuesta de Supabase contiene un objeto de error', async () => {
    req.body = { fileName: 'test.png' };
    
    // Se simula un error retornado por la API de Supabase
    mockStorage.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: 'Error de permisos de storage' }
    });

    await generarUrlSubida(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se pudo autorizar la subida al storage.' });
  });

  test('Debe imprimir una pista específica en consola si el error es de tipo 403 (Permisos)', async () => {
    req.body = { fileName: 'test.png' };
    
    // Se simula un error que dispare la pista de SERVICE_ROLE_KEY
    const error403 = new Error('Acceso denegado');
    error403.statusCode = '403';
    
    mockStorage.createSignedUploadUrl.mockRejectedValue(error403);

    await generarUrlSubida(req, res);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Verifica que SUPABASE_KEY'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('Debe imprimir una pista específica en consola si el error tiene estatus 400', async () => {
    req.body = { fileName: 'test.png' };
    
    // Se simula un error con status 400 para cubrir la otra parte de la condición lógica
    const error400 = { status: 400 };
    mockStorage.createSignedUploadUrl.mockRejectedValue(error400);

    await generarUrlSubida(req, res);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Verifica que SUPABASE_KEY'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('Debe manejar errores genéricos sin propiedades específicas de estatus', async () => {
    req.body = { fileName: 'test.png' };
    
    // Se simula una excepción genérica para cubrir el flujo básico del catch
    mockStorage.createSignedUploadUrl.mockRejectedValue(new Error('Fallo general'));

    await generarUrlSubida(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se pudo autorizar la subida al storage.' });
  });
});