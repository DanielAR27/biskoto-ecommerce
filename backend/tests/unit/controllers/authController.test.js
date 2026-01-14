const authController = require("../../../src/controllers/authController");
const supabase = require("../../../src/config/supabase");

// Se simula el cliente de Supabase.
// A diferencia de los otros controladores, Auth usa métodos directos (signUp, signIn, etc)
// y un namespace 'admin', por lo que la estructura del mock es diferente.
jest.mock("../../../src/config/supabase", () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    getUser: jest.fn(),
    admin: {
      updateUserById: jest.fn(),
    },
  },
}));

describe('AuthController - Pruebas Unitarias de Cobertura Completa', () => {
  let req, res;

  beforeAll(() => {
    // Se silencian los logs de consola que emite el controlador
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      body: {}, 
      headers: {} 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // --------------------------------------------------------------------------
  // MÉTODO: registrar
  // --------------------------------------------------------------------------
  describe('registrar', () => {
    const validBody = {
      email: 'test@test.com',
      password: 'password123',
      nombre: 'Juan',
      apellido: 'Perez',
      telefono: '88888888',
      direccion: 'San Jose',
    };

    test('Se valida que el email sea obligatorio', async () => {
      req.body = { ...validBody, email: '' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El correo electrónico es obligatorio.' });
    });

    test('Se valida que la contraseña sea obligatoria', async () => {
      req.body = { ...validBody, password: '' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La contraseña es obligatoria.' });
    });

    test('Se valida que el nombre sea obligatorio', async () => {
      req.body = { ...validBody, nombre: '' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El nombre es obligatorio.' });
    });

    test('Se valida que el apellido sea obligatorio', async () => {
      req.body = { ...validBody, apellido: '' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El apellido es obligatorio.' });
    });

    test('Se valida longitud mínima de contraseña (< 6)', async () => {
      req.body = { ...validBody, password: '123' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('al menos 6 caracteres') }));
    });

    test('Se valida formato de teléfono (nulo o regex incorrecto)', async () => {
      // Caso 1: Vacío
      req.body = { ...validBody, telefono: '' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      // Caso 2: Formato inválido
      req.body = { ...validBody, telefono: 'abc' };
      await authController.registrar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/8 números/) }));
    });

    test('Se registra usuario exitosamente (con dirección)', async () => {
      req.body = validBody;
      supabase.auth.signUp.mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });

      await authController.registrar(req, res);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: validBody.email,
        password: validBody.password,
        options: {
          data: {
            nombre: 'Juan',
            apellido: 'Perez',
            telefono: '88888888',
            direccion: 'San Jose' // Branch coverage: direccion existe
          }
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    });

    test('Se registra usuario exitosamente (sin dirección, branch coverage)', async () => {
      req.body = { ...validBody, direccion: null }; // Branch coverage: direccion es null
      supabase.auth.signUp.mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });

      await authController.registrar(req, res);

      expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
        options: {
          data: expect.objectContaining({
            direccion: null
          })
        }
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Se maneja error devuelto por Supabase al registrar', async () => {
      req.body = validBody;
      supabase.auth.signUp.mockResolvedValue({ 
        data: null, 
        error: { message: 'User already exists' } 
      });

      await authController.registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    test('Se maneja excepción inesperada en el proceso de registro', async () => {
      req.body = validBody;
      supabase.auth.signUp.mockRejectedValue(new Error('Crash'));

      await authController.registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------
  // MÉTODO: login
  // --------------------------------------------------------------------------
  describe('login', () => {
    test('Se valida que email y password sean requeridos', async () => {
      req.body = { email: '' };
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Correo y contraseña son requeridos.' });
    });

    test('Se maneja credenciales inválidas (error de Supabase)', async () => {
      req.body = { email: 'a@a.com', password: '123' };
      supabase.auth.signInWithPassword.mockResolvedValue({ 
        data: null, 
        error: { message: 'Invalid login' } 
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas.' });
    });

    test('Se inicia sesión exitosamente devolviendo tokens', async () => {
      req.body = { email: 'a@a.com', password: '123' };
      const mockSession = {
        session: {
          access_token: 'token123',
          refresh_token: 'refresh123',
          expires_at: 123456
        },
        user: { id: 'u1', email: 'a@a.com' }
      };
      
      supabase.auth.signInWithPassword.mockResolvedValue({ 
        data: mockSession, 
        error: null 
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token123',
        refresh_token: 'refresh123'
      }));
    });

    test('Se maneja excepción inesperada en login', async () => {
      req.body = { email: 'a@a.com', password: '123' };
      supabase.auth.signInWithPassword.mockRejectedValue(new Error('Crash'));

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------
  // MÉTODO: refreshSession
  // --------------------------------------------------------------------------
  describe('refreshSession', () => {
    test('Se valida que refresh_token sea obligatorio', async () => {
      req.body = {};
      await authController.refreshSession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Se maneja error o sesión nula al refrescar (token expirado)', async () => {
      req.body = { refresh_token: 'old_token' };
      
      // Caso A: Error explícito
      supabase.auth.refreshSession.mockResolvedValue({ data: {}, error: { message: 'Bad token' } });
      await authController.refreshSession(req, res);
      expect(res.status).toHaveBeenCalledWith(401);

      // Caso B: No hay error, pero tampoco session (data.session undefined)
      supabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: null });
      await authController.refreshSession(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('Se refresca la sesión exitosamente', async () => {
      req.body = { refresh_token: 'valid_token' };
      const mockData = {
        session: {
          access_token: 'new_access',
          refresh_token: 'new_refresh',
          expires_at: 99999
        }
      };
      
      supabase.auth.refreshSession.mockResolvedValue({ data: mockData, error: null });

      await authController.refreshSession(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'new_access' }));
    });

    test('Se maneja excepción inesperada en refresh', async () => {
      req.body = { refresh_token: 't' };
      supabase.auth.refreshSession.mockRejectedValue(new Error('Crash'));
      await authController.refreshSession(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------
  // MÉTODO: recuperarPassword
  // --------------------------------------------------------------------------
  describe('recuperarPassword', () => {
    test('Se envía correo de recuperación exitosamente', async () => {
      req.body = { email: 'test@test.com', redirectTo: 'http://localhost' };
      
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      await authController.recuperarPassword(req, res);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@test.com', { redirectTo: 'http://localhost' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Correo enviado' });
    });

    test('Se maneja error de Supabase al enviar correo', async () => {
      req.body = { email: 'test@test.com' };
      
      // Simula que Supabase retorna un error, lo cual lanza el throw dentro del try
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: { message: 'Limit exceeded' } });

      await authController.recuperarPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Limit exceeded' });
    });
  });

  // --------------------------------------------------------------------------
  // MÉTODO: actualizarPassword
  // --------------------------------------------------------------------------
  describe('actualizarPassword', () => {
    test('Se valida que exista el token de autorización en headers', async () => {
      req.headers = {}; // Sin authorization
      req.body = { password: 'new' };
      
      await authController.actualizarPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('Se valida que la contraseña sea requerida', async () => {
      req.headers = { authorization: 'Bearer token' };
      req.body = { password: '' };

      await authController.actualizarPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La contraseña es requerida' });
    });

    test('Se maneja token inválido o usuario no encontrado al verificar token', async () => {
      req.headers = { authorization: 'Bearer invalid_token' };
      req.body = { password: '123' };

      // Caso: Error en getUser
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Bad token' } });
      await authController.actualizarPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400); // Entra al catch

      // Caso: getUser ok pero user null
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      await authController.actualizarPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400); // Entra al catch por throw manual
    });

    test('Se actualiza contraseña exitosamente', async () => {
      req.headers = { authorization: 'Bearer valid_token' };
      req.body = { password: 'newPass' };

      // 1. getUser exitoso
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      // 2. updateUserById exitoso
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      await authController.actualizarPassword(req, res);

      expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('u1', { password: 'newPass' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Se maneja error durante la actualización del usuario (admin api)', async () => {
      req.headers = { authorization: 'Bearer valid_token' };
      req.body = { password: 'newPass' };

      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      // update falla
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'Weak password' } });

      await authController.actualizarPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No se pudo actualizar la contraseña' });
    });
  });
});