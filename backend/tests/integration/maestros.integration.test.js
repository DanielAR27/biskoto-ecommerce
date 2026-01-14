const request = require('supertest');
const app = require('../../src/app'); 
const supabase = require('../../src/config/supabase');

/**
 * MOCK DE SEGURIDAD PARA INTEGRACIÓN
 * Se salta la validación de token real para centrarse puramente
 * en si la API responde bien y guarda en la base de datos.
 * Simula que quien hace la petición es siempre un ADMIN.
 */
jest.mock('../../src/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'admin-test-id', email: 'admin@test.com' };
    next();
  },
  isAdmin: (req, res, next) => next() // Deja pasar siempre
}));

describe('Integración - Maestros (Categorías, Unidades e Ingredientes)', () => {
  // Variable para almacenar el ID de la categoría que se creará dinámicamente
  let categoriaIdCreada;
  
  // Genera un nombre único para no chocar con datos reales
  const nombreCategoriaTest = `Test Integration ${Date.now()}`;

  // ------------------------------------------------------------------------
  // BLOQUE: CATEGORÍAS (Ciclo de vida completo)
  // ------------------------------------------------------------------------
  describe('API /api/categorias', () => {
    
    test('POST / - Debe crear una categoría real en la Base de Datos', async () => {
      const nuevaCategoria = { 
        nombre: nombreCategoriaTest, 
        descripcion: 'Creada automáticamente por Jest' 
      };

      const res = await request(app)
        .post('/api/categorias')
        .send(nuevaCategoria);

      // Verificaciones de API
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('mensaje', 'Categoría creada con éxito.');
      expect(res.body.categoria).toHaveProperty('id');
      expect(res.body.categoria.nombre).toBe(nombreCategoriaTest);

      // Guardam el ID para usarlo en los siguientes tests (Update/Delete)
      categoriaIdCreada = res.body.categoria.id;
    });

    test('GET / - Debe listar la categoría recién creada', async () => {
      const res = await request(app).get('/api/categorias');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Busca en el array la categoría con el ID que se guardó antes
      const categoriaEncontrada = res.body.find(c => c.id === categoriaIdCreada);
      expect(categoriaEncontrada).toBeDefined();
      expect(categoriaEncontrada.nombre).toBe(nombreCategoriaTest);
    });

    test('GET /:id - Debe obtener el detalle de la categoría específica', async () => {
      const res = await request(app).get(`/api/categorias/${categoriaIdCreada}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(categoriaIdCreada);
    });

    test('PUT /:id - Debe actualizar la categoría en la Base de Datos', async () => {
      const updates = { 
        nombre: `${nombreCategoriaTest} Edited`, 
        descripcion: 'Descripción actualizada' 
      };

      const res = await request(app)
        .put(`/api/categorias/${categoriaIdCreada}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      expect(res.body.categoria.nombre).toBe(updates.nombre);
    });

    test('DELETE /:id - Debe eliminar la categoría físicamente', async () => {
      const res = await request(app).delete(`/api/categorias/${categoriaIdCreada}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('mensaje', 'Categoría eliminada correctamente.');
    });

    test('GET /:id - Debe retornar 404 confirmando que ya no existe', async () => {
      const res = await request(app).get(`/api/categorias/${categoriaIdCreada}`);
      // Dependiendo del controlador, si no existe puede dar 404
      expect(res.statusCode).toEqual(404);
    });
  });

  // ------------------------------------------------------------------------
  // BLOQUE: UNIDADES (Solo Lectura)
  // ------------------------------------------------------------------------
  describe('API /api/unidades', () => {
    test('GET / - Debe retornar el catálogo de unidades (kg, g, etc.)', async () => {
      const res = await request(app).get('/api/unidades');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verifica que al menos venga una unidad si la DB ya tiene seeds
      // Si la DB está vacía, al menos que sea un array []
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('nombre');
        expect(res.body[0]).toHaveProperty('abreviatura');
      }
    });
  });


    // ------------------------------------------------------------------------
  // BLOQUE: INGREDIENTES (Ciclo de vida completo)
  // ------------------------------------------------------------------------
  describe('API /api/ingredientes', () => {
    let ingredienteIdCreada;
    let unidadIdValida;
    const nombreIngredienteTest = `Ingrediente Test ${Date.now()}`;

    // Se recupera una unidad de medida real de la base de datos para usar su ID
    beforeAll(async () => {
      const resUnidades = await request(app).get('/api/unidades');
      if (resUnidades.body.length > 0) {
        unidadIdValida = resUnidades.body[0].id;
      }
    });

    test('POST / - Debe crear un ingrediente vinculado a una unidad existente', async () => {
      // Se verifica que existan datos maestros de unidades antes de proceder
      expect(unidadIdValida).toBeDefined();

      const nuevoIngrediente = {
        nombre: nombreIngredienteTest,
        stock_actual: 100,
        unidad_id: unidadIdValida,
        es_ilimitado: false
      };

      const res = await request(app)
        .post('/api/ingredientes')
        .send(nuevoIngrediente);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('mensaje', expect.stringMatching(/éxito/i));
      expect(res.body.ingrediente).toHaveProperty('id');
      expect(res.body.ingrediente.nombre).toBe(nombreIngredienteTest);

      ingredienteIdCreada = res.body.ingrediente.id;
    });

    test('GET / - Debe listar los ingredientes y encontrar el registro recién creado', async () => {
      const res = await request(app).get('/api/ingredientes');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const ingredienteEncontrado = res.body.find(i => i.id === ingredienteIdCreada);
      expect(ingredienteEncontrado).toBeDefined();
    });

    test('GET /:id - Debe obtener el detalle completo del ingrediente', async () => {
      const res = await request(app).get(`/api/ingredientes/${ingredienteIdCreada}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(ingredienteIdCreada);
      expect(res.body.nombre).toBe(nombreIngredienteTest);
    });

    test('PUT /:id - Debe actualizar nombre/unidad pero IGNORAR cambios directos al stock', async () => {
      const updates = { 
        nombre: `${nombreIngredienteTest} Editado`,
        stock_actual: 250, // El test intenta "engañar" al sistema
        es_ilimitado: true
      };

      const res = await request(app)
        .put(`/api/ingredientes/${ingredienteIdCreada}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      
      // VERIFICACIÓN DE SEGURIDAD:
      // El stock debe seguir siendo 0, ignorando el '250' enviado
      expect(res.body.ingrediente.stock_actual).toBe(0); 
      
      // El resto de campos permitidos sí deben haber cambiado
      expect(res.body.ingrediente.nombre).toContain('Editado');
      expect(res.body.ingrediente.es_ilimitado).toBe(true);
    });

    test('POST / - Debe retornar 400 si los datos de entrada son insuficientes', async () => {
      // Se intenta crear un ingrediente sin el nombre obligatorio
      const res = await request(app)
        .post('/api/ingredientes')
        .send({ stock_actual: 50 });

      expect(res.statusCode).toEqual(400);
    });

    test('DELETE /:id - Debe eliminar el ingrediente de la base de datos', async () => {
      const res = await request(app).delete(`/api/ingredientes/${ingredienteIdCreada}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('mensaje', 'Ingrediente eliminado correctamente del inventario.');
    });

    test('GET /:id - Debe retornar 404 al intentar buscar el ingrediente eliminado', async () => {
      const res = await request(app).get(`/api/ingredientes/${ingredienteIdCreada}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});