const { listarUnidades } = require('../../../src/controllers/unidadController');
const supabase = require('../../../src/config/supabase');

// Se simula el cliente de Supabase
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn()
}));

describe('UnidadController - Suite de Cobertura Total', () => {
  let req, res;

  beforeAll(() => {
    // Se silencia console.error para las pruebas de fallo
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Se restaura la consola
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test('Debe retornar la lista de unidades con estatus 200 y ordenada por nombre', async () => {
    const mockData = [{ id: 1, nombre: 'Gramos' }];
    
    // Se configura la cadena de métodos: from -> select -> order
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    await listarUnidades(req, res);

    expect(supabase.from).toHaveBeenCalledWith('unidades_medida');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('Debe capturar el error de Supabase y retornar estatus 500', async () => {
    // Se simula un error retornado por el cliente de Supabase
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fail' } })
    });

    await listarUnidades(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener el catálogo de unidades.' });
  });

  test('Debe capturar una excepción inesperada en el bloque catch', async () => {
    // Se fuerza una excepción lanzando un error directo
    supabase.from.mockImplementation(() => { throw new Error('Exception'); });

    await listarUnidades(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});