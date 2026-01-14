const { 
  listarUsuarios, 
  obtenerUsuario, 
  actualizarUsuario, 
  eliminarUsuario 
} = require('../../../src/controllers/usuarioController');
const supabase = require('../../../src/config/supabase');

// Simular el cliente de Supabase y sus servicios de autenticación administrativa
jest.mock('../../../src/config/supabase', () => ({
  from: jest.fn(),
  auth: {
    admin: {
      updateUserById: jest.fn()
    }
  }
}));

describe('UsuarioController - Suite de Pruebas de Cobertura Total', () => {
  let req, res;

  beforeAll(() => {
    // Silenciar la consola de errores para mantener la terminal limpia durante las pruebas de fallo
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar el comportamiento original de la consola al finalizar
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Reiniciar el estado de los mocks y definir los objetos básicos de Express
    jest.clearAllMocks();
    req = { 
      params: {}, 
      body: {}, 
      user: { id: 'admin-actual-id' } // ID del administrador que realiza la petición
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // --------------------------------------------------------------------------------
  // BLOQUE: LISTAR USUARIOS
  // --------------------------------------------------------------------------------
  describe('listarUsuarios', () => {
    test('Debe retornar estatus 200 y la lista de usuarios activos/inactivos (no eliminados)', async () => {
      const mockData = [{ id: 'u1', nombre: 'Test' }];
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await listarUsuarios(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    test('Debe capturar error y retornar estatus 500 si falla la consulta', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      });

      await listarUsuarios(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Error al obtener') }));
    });
  });

  // --------------------------------------------------------------------------------
  // BLOQUE: OBTENER USUARIO
  // --------------------------------------------------------------------------------
  describe('obtenerUsuario', () => {
    test('Debe retornar estatus 200 y los datos del usuario si existe', async () => {
      req.params.id = 'u1';
      const mockUser = { id: 'u1', nombre: 'Usuario' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      });

      await obtenerUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('Debe retornar estatus 404 si el usuario no es encontrado', async () => {
      req.params.id = 'u-no-existe';
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not Found' } })
      });

      await obtenerUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado.' });
    });

    test('Debe capturar excepciones inesperadas y retornar estatus 500', async () => {
      req.params.id = 'u1';
      supabase.from.mockImplementation(() => { throw new Error('Crash'); });

      await obtenerUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // BLOQUE CRÍTICO: ACTUALIZAR USUARIO
  // --------------------------------------------------------------------------------
  describe('actualizarUsuario', () => {
    
    // CASO 1: Validaciones de Auto-Modificación
    test('Debe bloquear degradación de rol si el admin se edita a sí mismo (403)', async () => {
      req.params.id = 'admin-actual-id'; // Coincide con req.user.id
      req.body = { rol: 'user' };

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('quitarte el rol') }));
    });

    test('Debe bloquear desactivación de cuenta si el admin se edita a sí mismo (403)', async () => {
      req.params.id = 'admin-actual-id';
      req.body = { activo: false };

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('desactivar tu propia cuenta') }));
    });

    // CASO 2: Protección del Último Administrador (Líneas 64-77)
    test('Debe bloquear la acción si se intenta afectar al único administrador existente (400)', async () => {
      req.params.id = 'otro-admin-id';
      req.body = { activo: false }; // Dispara la validación

      // Mock 1: Verificar que el usuario objetivo ES administrador
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // Mock 2: Contar administradores activos (Solo 1 encontrado)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 1 })
      });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('único administrador') }));
    });

    test('Debe permitir la acción si existen más administradores activos', async () => {
      req.params.id = 'otro-admin-id';
      req.body = { rol: 'user' }; // Intentar degradar

      // Mock 1: Objetivo es admin
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'admin' } })
      });

      // Mock 2: Hay 2 administradores (seguro proceder)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 2 })
      });

      // Mock 3: Update final
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe saltar validación de conteo si el usuario objetivo NO es admin', async () => {
      req.params.id = 'usuario-normal-id';
      req.body = { activo: false };

      // Mock 1: Objetivo es usuario normal (no entra al bloque de conteo)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'user' } })
      });

      // Mock 2: Auth Update (Ban)
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      // Mock 3: DB Update
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    // CASO 3: Sincronización de Email (Línea 86 y 95)
    test('Debe sincronizar email y lanzar error 500 si falla Auth', async () => {
      req.params.id = 'u1';
      req.body = { email: 'nuevo@test.com' }; // Dispara bloque if(email)

      // Simular error en Auth
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'Auth Fail' } });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    // CASO 4: Sincronización de Baneo (Línea 105)
    test('Debe aplicar baneo (876000h) cuando activo es false', async () => {
      req.params.id = 'u1';
      req.body = { activo: false }; // Dispara bloque if(activo !== undefined)

      // Mock para comprobación de rol (usuario normal)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { rol: 'user' } })
      });

      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await actualizarUsuario(req, res);

      expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('u1', { ban_duration: '876000h' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe levantar baneo ("none") cuando activo es true', async () => {
      req.params.id = 'u1';
      req.body = { activo: true };

      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await actualizarUsuario(req, res);

      expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('u1', { ban_duration: 'none' });
    });

    test('Debe lanzar error 500 si falla la sincronización de baneo en Auth', async () => {
      req.params.id = 'u1';
      req.body = { activo: true };

      supabase.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'Ban Error' } });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    // CASO 5: Validación de Teléfono (Línea 112)
    test('Debe retornar 400 si el teléfono no cumple con el formato de 8 dígitos', async () => {
      req.params.id = 'u1';
      req.body = { telefono: '123' }; // Inválido

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El teléfono debe ser un número válido de 8 dígitos.' });
    });

    // CASO 6: Error en Base de Datos Final (Línea 129)
    test('Debe capturar error en la actualización final del perfil y retornar 500', async () => {
      req.params.id = 'u1';
      req.body = { nombre: 'Cambio Simple' };

      // Mock directo al update final (sin validar admins ni auth)
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB Write Error' } })
      });

      await actualizarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --------------------------------------------------------------------------------
  // BLOQUE: ELIMINAR USUARIO
  // --------------------------------------------------------------------------------
  describe('eliminarUsuario', () => {
    test('Debe prohibir la auto-eliminación de la cuenta propia (403)', async () => {
      req.params.id = 'admin-actual-id'; // ID coincide con req.user.id

      await eliminarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No puedes eliminar tu propia cuenta.' });
    });

    test('Debe realizar Soft Delete y bloqueo de acceso exitosamente', async () => {
      req.params.id = 'u-target';

      // Mock 1: Ban en Auth
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      // Mock 2: Update en DB (Soft Delete)
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await eliminarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Usuario enviado a la papelera.' });
    });

    test('Debe retornar 500 si falla el baneo previo a la eliminación', async () => {
      req.params.id = 'u-target';
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'Auth Error' } });

      await eliminarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Debe capturar error y retornar 500 si falla la actualización en base de datos (Línea 170)', async () => {
      req.params.id = 'u-target';

      // Mock 1: Ban exitoso
      supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      // Mock 2: Falla en DB
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB Delete Error' } })
      });

      await eliminarUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});