const { verifyToken, isAdmin } = require('../../../src/middleware/authMiddleware');
const supabase = require('../../../src/config/supabase');

// Se simula el cliente de Supabase
jest.mock('../../../src/config/supabase', () => ({
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}));

describe('AuthMiddleware - Suite de Cobertura Total', () => {
  let req, res, next;

  beforeEach(() => {
    // Se reinician los mocks y se definen los objetos de Express
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('verifyToken', () => {
    test('Debe retornar 401 si no se proporciona el token en los headers', async () => {
      req.headers.authorization = undefined;

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acceso no proporcionado' });
    });

    test('Debe permitir el acceso y guardar el usuario en req si el token es válido', async () => {
      req.headers.authorization = 'Bearer token-valido';
      const mockUser = { id: 'user-123' };
      
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      await verifyToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('Debe retornar 401 si Supabase indica que el token es inválido o expira', async () => {
      req.headers.authorization = 'Bearer token-malo';
      
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('Debe capturar excepciones y retornar 500 en el bloque catch', async () => {
      req.headers.authorization = 'Bearer token';
      supabase.auth.getUser.mockImplementation(() => { throw new Error('Crash'); });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('isAdmin', () => {
    test('Debe llamar a next si el usuario tiene el rol de administrador', async () => {
      req.user = { id: 'admin-id' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' }, error: null })
      });

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('Debe retornar 403 si el rol del usuario no es administrador', async () => {
      req.user = { id: 'user-id' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'cliente' }, error: null })
      });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('permisos') }));
    });

    test('Debe retornar 403 si ocurre un error en la consulta a la base de datos', async () => {
      req.user = { id: 'user-id' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('Debe retornar 500 si ocurre una excepción inesperada al verificar permisos', async () => {
      req.user = { id: 'user-id' };
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});