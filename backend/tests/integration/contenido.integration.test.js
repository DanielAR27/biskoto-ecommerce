const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabase');

// ----------------------------------------------------------------------
// MOCK DE MIDDLEWARE (Estrategia Stateless Robusta)
// Inyecta el usuario decodificando el JSON del header Authorization.
// IMPORTANTE: Este mock solo funciona en rutas que usen 'verifyToken'.
// ----------------------------------------------------------------------
jest.mock('../../src/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'No token' });
      
      const tokenString = authHeader.split('Bearer ')[1];
      if (!tokenString) return res.status(401).json({ error: 'Token format invalid' });
      
      req.user = JSON.parse(tokenString);
      next();
    } catch (e) {
      console.error('Error parseando token mock:', e);
      res.status(401).json({ error: 'Token inválido en test' });
    }
  },
  isAdmin: (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado (Mock)' });
    }
  }
}));

describe('Integración - Contenido y Engagement (Noticias y Comentarios)', () => {
  let adminId, clienteId;
  let noticiaId, comentarioId;
  let tokenAdmin, tokenCliente;

  /**
   * PREPARACIÓN DEL ENTORNO
   */
  beforeAll(async () => {
    // 1. CREAR ADMIN
    const emailAdmin = `admin.contenido.${Date.now()}@test.com`;
    const { data: authAdmin, error: errAdmin } = await supabase.auth.signUp({
      email: emailAdmin,
      password: 'password123',
      options: { data: { nombre: 'Editor', apellido: 'Jefe', telefono: '88888888' } }
    });
    if (errAdmin) throw errAdmin;
    adminId = authAdmin.user.id;

    // Asegurar rol en perfil
    await supabase.from('perfiles').upsert({
      id: adminId,
      rol: 'admin',
      email: emailAdmin,
      nombre: 'Editor',
      apellido: 'Jefe',
      telefono: '88888888'
    });

    tokenAdmin = `Bearer ${JSON.stringify({ id: adminId, rol: 'admin', email: emailAdmin })}`;

    // 2. CREAR CLIENTE
    const emailCliente = `lector.contenido.${Date.now()}@test.com`;
    const { data: authCliente, error: errCliente } = await supabase.auth.signUp({
      email: emailCliente,
      password: 'password123',
      options: { data: { nombre: 'Lector', apellido: 'Común', telefono: '77777777' } }
    });
    if (errCliente) throw errCliente;
    clienteId = authCliente.user.id;

    await supabase.from('perfiles').upsert({
      id: clienteId,
      rol: 'cliente',
      email: emailCliente,
      nombre: 'Lector',
      apellido: 'Común',
      telefono: '77777777'
    });

    tokenCliente = `Bearer ${JSON.stringify({ id: clienteId, rol: 'cliente', email: emailCliente })}`;
  });

  /**
   * LIMPIEZA
   */
  afterAll(async () => {
    if (comentarioId) await supabase.from('comentarios').delete().eq('id', comentarioId);
    if (noticiaId) await supabase.from('noticias').delete().eq('id', noticiaId);
    if (adminId) await supabase.from('perfiles').delete().eq('id', adminId);
    if (clienteId) await supabase.from('perfiles').delete().eq('id', clienteId);
  });

  // ======================================================================
  // 1. MÓDULO DE NOTICIAS
  // ======================================================================
  describe('Módulo de Noticias', () => {
    
    test('POST /api/noticias - Admin crea una noticia', async () => {
      const nuevaNoticia = {
        titulo: 'Nueva Receta de Pan',
        extracto: 'Aprende a hacer pan casero',
        contenido: '<p>Detalles de la receta...</p>',
        categoria: 'recetas',
        imagen_url: 'http://bucket/pan.jpg',
        activo: true
      };

      const res = await request(app)
        .post('/api/noticias')
        .set('Authorization', tokenAdmin)
        .send(nuevaNoticia);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toMatch(/creada exitosamente/i);
      noticiaId = res.body.noticia.id;
    });

    test('GET /api/noticias - El público debe ver la noticia activa', async () => {
      const res = await request(app).get('/api/noticias');
      expect(res.statusCode).toEqual(200);
      const noticiaEncontrada = res.body.find(n => n.id === noticiaId);
      expect(noticiaEncontrada).toBeDefined();
    });

    test('PUT /api/noticias/:id - Admin desactiva la noticia', async () => {
      const res = await request(app)
        .put(`/api/noticias/${noticiaId}`)
        .set('Authorization', tokenAdmin)
        .send({ activo: false, titulo: 'Receta Archivada' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.noticia.activo).toBe(false);
    });

    test('GET /api/noticias/:id - El público NO debe ver una noticia inactiva', async () => {
      const res = await request(app)
        .get(`/api/noticias/${noticiaId}`)
        .set('Authorization', tokenCliente); 

      expect(res.statusCode).toEqual(404);
    });

    test('GET /api/noticias/:id - El ADMIN también recibe 404 (Arquitectura Actual)', async () => {
      // NOTA TÉCNICA:
      // Como la ruta GET /:id es pública en 'noticiasRoutes.js' y no usa 'verifyToken',
      // el controlador no recibe el usuario. Por tanto, el Admin es tratado como público
      // y tampoco puede ver la noticia inactiva.
      const res = await request(app)
        .get(`/api/noticias/${noticiaId}`)
        .set('Authorization', tokenAdmin);

      expect(res.statusCode).toEqual(404); // Correcto según el código actual
    });

    test('PUT /api/noticias/:id - Restaurar noticia a activa para pruebas de comentarios', async () => {
      // Se reactiva la noticia para poder comentar en ella
      await supabase.from('noticias').update({ activo: true }).eq('id', noticiaId);
    });
  });

  // ======================================================================
  // 2. MÓDULO DE COMENTARIOS
  // ======================================================================
  describe('Módulo de Comentarios', () => {

    test('POST /api/comentarios - Cliente crea un comentario', async () => {
      const nuevoComentario = {
        noticia_id: noticiaId,
        contenido: '¡Excelente receta, gracias!'
      };

      const res = await request(app)
        .post('/api/comentarios')
        .set('Authorization', tokenCliente)
        .send(nuevoComentario);

      expect(res.statusCode).toEqual(201);
      comentarioId = res.body.comentario.id;
    });

    test('PUT /api/comentarios/:id/rechazar - Admin rechaza el comentario', async () => {
      const res = await request(app)
        .put(`/api/comentarios/${comentarioId}/rechazar`)
        .set('Authorization', tokenAdmin);

      expect(res.statusCode).toEqual(200);
      expect(res.body.comentario.estado).toBe('rechazado');
    });

    test('GET /api/comentarios/noticia/:id - Público NO debe ver comentarios rechazados', async () => {
      const res = await request(app)
        .get(`/api/comentarios/noticia/${noticiaId}`)
        .set('Authorization', tokenCliente);

      const comentarioVisible = res.body.find(c => c.id === comentarioId);
      expect(comentarioVisible).toBeUndefined();
    });

    test('GET /api/comentarios/noticia/:id - ADMIN tampoco ve rechazados (Arquitectura Actual)', async () => {
      // NOTA TÉCNICA:
      // Al igual que con noticias, la ruta de listar comentarios es pública.
      // El Admin no se autentica en esta ruta, por lo que se aplica el filtro de "solo aprobados".
      const res = await request(app)
        .get(`/api/comentarios/noticia/${noticiaId}`)
        .set('Authorization', tokenAdmin);

      const comentarioVisible = res.body.find(c => c.id === comentarioId);
      expect(comentarioVisible).toBeUndefined(); // Correcto según el código actual
    });

    test('PUT /api/comentarios/:id - Cliente intenta editar comentario ajeno (Debe fallar)', async () => {
      // Se intenta editar con tokenAdmin un comentario de tokenCliente.
      const res = await request(app)
        .put(`/api/comentarios/${comentarioId}`)
        .set('Authorization', tokenAdmin) 
        .send({ contenido: 'Intento de hackeo' });

      // Puede ser 403 (Prohibido) o 404 (No encontrado por filtro de usuario)
      expect([403, 404]).toContain(res.statusCode);
    });

    test('DELETE /api/comentarios/:id - Cliente elimina su propio comentario', async () => {
      const res = await request(app)
        .delete(`/api/comentarios/${comentarioId}`)
        .set('Authorization', tokenCliente);

      expect(res.statusCode).toEqual(200);
    });
  });
});