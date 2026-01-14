const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabase');

// ----------------------------------------------------------------------
// CONFIGURACIÓN DE MOCKS
// Se interceptan las llamadas a Supabase para simular la base de datos
// y el servicio de autenticación sin realizar conexiones reales.
// ----------------------------------------------------------------------
jest.mock('../../src/config/supabase', () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    admin: {
      updateUserById: jest.fn()
    },
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn()
  },
  from: jest.fn()
}));

describe('Integración - Grupo Identidad y Control de Accesos', () => {
  // Variables para simular usuarios
  const adminId = 'admin-uuid-123';
  const userId = 'user-uuid-456';
  const targetId = 'target-uuid-789';
  const tokenValido = 'Bearer valid-token';

  beforeEach(() => {
    // Se limpian los mocks antes de cada prueba para evitar interferencias
    jest.clearAllMocks();
  });

  // ======================================================================
  // 1. MÓDULO DE AUTENTICACIÓN (/api/auth)
  // ======================================================================
  describe('Autenticación (AuthController)', () => {
    
    test('POST /registrar - Debe registrar usuario y retornar 201', async () => {
      const nuevoUsuario = {
        email: 'test@mail.com',
        password: 'password123',
        nombre: 'Test',
        apellido: 'User',
        telefono: '88888888',
        direccion: 'San José'
      };

      // Se simula respuesta exitosa de Supabase Auth
      supabase.auth.signUp.mockResolvedValue({ 
        data: { user: { id: userId } }, 
        error: null 
      });

      const res = await request(app).post('/api/auth/registrar').send(nuevoUsuario);

      expect(res.statusCode).toEqual(201);
      expect(res.body.mensaje).toMatch(/registrado exitosamente/i);
      // Se verifica que se enviaron los metadatos correctos a Supabase
      expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
        options: {
          data: expect.objectContaining({
            nombre: 'Test',
            telefono: '88888888'
          })
        }
      }));
    });

    test('POST /registrar - Debe retornar 400 si el teléfono es inválido', async () => {
      const usuarioInvalido = {
        email: 'test@mail.com',
        password: 'password123',
        nombre: 'Test',
        apellido: 'User',
        telefono: '123' // Inválido (requiere 8 dígitos)
      };

      const res = await request(app).post('/api/auth/registrar').send(usuarioInvalido);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/teléfono debe tener exactamente 8 números/i);
    });

    test('POST /login - Debe retornar tokens al iniciar sesión (200)', async () => {
      const credenciales = { email: 'admin@mail.com', password: '123' };

      // Se simula respuesta de login exitoso con sesión
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { 
          session: { 
            access_token: 'abc', 
            refresh_token: 'xyz', 
            expires_at: 12345 
          },
          user: { id: adminId, email: credenciales.email }
        },
        error: null
      });

      const res = await request(app).post('/api/auth/login').send(credenciales);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refresh_token');
    });

    test('POST /login - Debe retornar 401 si las credenciales son incorrectas', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login' }
      });

      const res = await request(app).post('/api/auth/login').send({ email: 'a', password: 'b' });
      expect(res.statusCode).toEqual(401);
    });

    test('POST /actualizar-password - Debe actualizar contraseña si el token es válido (200)', async () => {
      // 1. Auth Middleware: Valida token
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
      
      // 2. Controller: Actualiza password
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      const res = await request(app)
        .post('/api/auth/actualizar-password')
        .set('Authorization', tokenValido)
        .send({ password: 'newpass' });

      expect(res.statusCode).toEqual(200);
    });
  });

  // ======================================================================
  // 2. PERFILES DE USUARIO (/api/perfiles)
  // ======================================================================
  describe('Gestión de Perfil Personal (PerfilController)', () => {
    
    test('GET /me - Debe obtener datos del perfil propio', async () => {
      // 1. Auth Middleware
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });

      // 2. Controller: Consulta DB
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: userId, nombre: 'Mi Perfil' }, 
          error: null 
        })
      });

      const res = await request(app)
        .get('/api/perfiles/me')
        .set('Authorization', tokenValido);

      expect(res.statusCode).toEqual(200);
      expect(res.body.nombre).toBe('Mi Perfil');
    });

    test('PATCH /update - Debe actualizar datos propios y validar campos requeridos', async () => {
      // 1. Simulación de Middleware de Autenticación
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });

      // 2. Simulación de la respuesta de la base de datos (Supabase)
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: userId, nombre: 'Nuevo Nombre', apellido: 'Apellido', telefono: '88888888' }, 
          error: null 
        })
      });

      // 3. Ejecución de la petición usando PATCH y la ruta correcta
      const res = await request(app)
        .patch('/api/perfiles/update') // Se ajustó el método y la ruta según perfilRoutes.js
        .set('Authorization', tokenValido)
        .send({ nombre: 'Nuevo Nombre', apellido: 'Apellido', telefono: '88888888' });

      // 4. Verificación de resultados
      expect(res.statusCode).toEqual(200);
      expect(res.body.mensaje).toMatch(/Perfil actualizado correctamente/i);
      expect(res.body.perfil.nombre).toBe('Nuevo Nombre');
    });
  });

  // ======================================================================
  // 3. GESTIÓN ADMINISTRATIVA DE USUARIOS (/api/usuarios)
  // ======================================================================
  describe('Administración de Usuarios (UsuarioController)', () => {

    /**
     * Helper para configurar mocks simulando que quien llama es un ADMIN.
     * Configura auth.getUser y la consulta de rol del middleware isAdmin.
     */
    const setupAdminContext = () => {
      // 1. Auth: Token válido del admin
      supabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: adminId } }, 
        error: null 
      });

      // Se prepara el mock de 'from' para responder a múltiples llamadas en secuencia
      const mockSelect = jest.fn();
      supabase.from.mockReturnValue({ 
        select: mockSelect,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }) // Default fallback
      });

      return mockSelect;
    };

    test('GET / - Debe listar usuarios (Solo Admin)', async () => {
      const mockSelect = setupAdminContext();

      // Llamada 1 (Middleware isAdmin): Retorna rol 'admin'
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' }, error: null })
      });

      // Llamada 2 (Controller listarUsuarios): Retorna lista
      const mockLista = [{ id: 1, nombre: 'User1' }];
      mockSelect.mockReturnValueOnce({
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLista, error: null })
      });

      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', tokenValido);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    test('GET / - Debe denegar acceso si el usuario NO es admin (403)', async () => {
      // 1. Auth: Token válido de usuario normal
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });

      // 2. Middleware isAdmin: Retorna rol 'cliente'
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'cliente' }, error: null })
      });

      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', tokenValido);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toMatch(/acceso denegado/i);
    });

    test('PUT /:id - Debe bloquear intento de auto-desactivación (Seguridad)', async () => {
      const mockSelect = setupAdminContext();
      
      // Llamada 1 (isAdmin): Es admin
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // Intentamos desactivar al mismo usuario que hace la petición (adminId)
      const res = await request(app)
        .put(`/api/usuarios/${adminId}`) 
        .set('Authorization', tokenValido)
        .send({ activo: false });

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toMatch(/no puedes desactivar tu propia cuenta/i);
    });

    test('PUT /:id - Debe bloquear desactivación del ÚNICO administrador', async () => {
      const mockSelect = setupAdminContext();

      // Llamada 1 (isAdmin): Es admin
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // Llamada 2 (Validar Target): El usuario objetivo ES admin
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(), // eq('id', targetId)
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // Llamada 3 (Contar Admins): Solo queda 1 admin activo
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 1 })
      });

      const res = await request(app)
        .put(`/api/usuarios/${targetId}`)
        .set('Authorization', tokenValido)
        .send({ activo: false });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/único administrador/i);
    });

    test('PUT /:id - Debe actualizar usuario correctamente y sincronizar con Auth', async () => {
      const mockSelect = setupAdminContext();

      // 1. isAdmin -> Admin
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // 2. Validar Target -> Es cliente (no entra a validación de único admin)
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'cliente' } })
      });

      // 3. Mock Update DB (UsuarioController)
      const mockUpdate = jest.fn().mockReturnThis();
      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      // 4. Mock Auth Update (Sincronización de ban/email)
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      const res = await request(app)
        .put(`/api/usuarios/${targetId}`)
        .set('Authorization', tokenValido)
        .send({ activo: true, email: 'nuevo@mail.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.mensaje).toMatch(/actualizado correctamente/i);
      // Se verifica que se llamó a la sincronización de Auth
      expect(supabase.auth.admin.updateUserById).toHaveBeenCalled();
    });

    test('DELETE /:id - Debe aplicar soft-delete y bloqueo (Ban)', async () => {
      const mockSelect = setupAdminContext();

      // 1. isAdmin -> Admin
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // 2. Mock Auth Ban
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      // 3. Mock DB Update (Soft Delete)
      const mockUpdate = jest.fn().mockReturnThis();
      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      const res = await request(app)
        .delete(`/api/usuarios/${targetId}`)
        .set('Authorization', tokenValido);

      expect(res.statusCode).toEqual(200);
      expect(res.body.mensaje).toMatch(/papelera/i);
      
      // Se verifica que se aplicó el Soft Delete (activo: false, eliminado_el: fecha)
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        activo: false,
        eliminado_el: expect.any(String)
      }));
    });
  });
});