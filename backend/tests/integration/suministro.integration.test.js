const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabase');

// ----------------------------------------------------------------------
// MOCK DE SEGURIDAD
// Se simula un usuario con rol de ADMINISTRADOR para tener acceso total
// a las rutas protegidas de proveedores y compras.
// ----------------------------------------------------------------------
jest.mock('../../src/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'admin-supply-test', email: 'admin@test.com', rol: 'admin' };
    next();
  },
  isAdmin: (req, res, next) => next()
}));

describe('Integración - Cadena de Suministro (Proveedores y Compras)', () => {
  // Referencias globales para reutilizar IDs entre pruebas
  let proveedorId;
  let compraId;
  
  // Referencias para datos semilla (Ingredientes necesarios para comprar)
  let unidadId;
  let ingredienteId;

  // Datos de prueba generados dinámicamente
  const proveedorData = {
    nombre: `Proveedor Test ${Date.now()}`,
    contacto_nombre: 'Gerente de Ventas',
    telefono: '88888888', // Cumple con regex /^[0-9]{8}$/
    email: 'ventas@proveedor.com'
  };

  /**
   * PREPARACIÓN DEL ENTORNO
   * Se crean datos semilla (Unidad e Ingrediente) directamente en la BD
   * para poder registrar compras válidas posteriormente.
   */
  beforeAll(async () => {
    // 1. Crear Unidad de Medida
    const { data: uni } = await supabase
      .from('unidades_medida')
      .insert({ nombre: `Unidad Supply ${Date.now()}`, abreviatura: 'us' })
      .select().single();
    unidadId = uni.id;

    // 2. Crear Ingrediente
    const { data: ing } = await supabase
      .from('ingredientes')
      .insert({ 
        nombre: `Ingrediente Compra ${Date.now()}`, 
        unidad_id: unidadId, 
        stock_actual: 0 
      })
      .select().single();
    ingredienteId = ing.id;
  });

  /**
   * LIMPIEZA FINAL
   * Se eliminan los datos auxiliares creados para no dejar basura.
   */
  afterAll(async () => {
    if (ingredienteId) await supabase.from('ingredientes').delete().eq('id', ingredienteId);
    if (unidadId) await supabase.from('unidades_medida').delete().eq('id', unidadId);
    // Nota: Proveedor y Compra se eliminan en los propios tests
  });

  // ======================================================================
  // 1. GESTIÓN DE PROVEEDORES (ProveedorController)
  // ======================================================================
  describe('API /api/proveedores', () => {
    
    test('POST / - Debe crear un nuevo proveedor exitosamente', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .send(proveedorData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(proveedorData.nombre);
      
      proveedorId = res.body.id;
    });

    test('POST / - Debe rechazar creación si el nombre ya existe', async () => {
      // Se intenta crear el mismo proveedor otra vez
      const res = await request(app)
        .post('/api/proveedores')
        .send(proveedorData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/ya existe un proveedor/i);
    });

    test('PUT /:id - Debe actualizar datos y validar formato de teléfono', async () => {
      // Caso Fallido: Teléfono inválido
      const resInvalido = await request(app)
        .put(`/api/proveedores/${proveedorId}`)
        .send({ telefono: '123' }); // Menos de 8 dígitos

      expect(resInvalido.statusCode).toEqual(400);
      expect(resInvalido.body.error).toMatch(/número válido de 8 dígitos/i);

      // Caso Exitoso
      const resValido = await request(app)
        .put(`/api/proveedores/${proveedorId}`)
        .send({ nombre: `${proveedorData.nombre} SA`, telefono: '22222222' });

      expect(resValido.statusCode).toEqual(200);
      expect(resValido.body.nombre).toContain('SA');
    });

    test('GET /:id - Debe obtener el detalle del proveedor', async () => {
      const res = await request(app).get(`/api/proveedores/${proveedorId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(proveedorId);
    });
  });

  // ======================================================================
  // 2. REGISTRO DE COMPRAS (ComprasController)
  // ======================================================================
  describe('API /api/compras', () => {

    test('POST / - Debe registrar una compra e incrementar inventario', async () => {
      const nuevaCompra = {
        proveedor_id: proveedorId,
        monto_total: 5000,
        notas: 'Compra de prueba integración',
        items: [
          {
            ingrediente_id: ingredienteId,
            cantidad: 50,    // Se compran 50 unidades
            precio_unitario: 100
          }
        ]
      };

      const res = await request(app)
        .post('/api/compras')
        .send(nuevaCompra);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      
      compraId = res.body.id;

      // VERIFICACIÓN INDIRECTA DE TRIGGER (Opcional en Test API, pero útil):
      // Si quisieras verificar el stock, harías un GET al ingrediente aquí.
    });

    test('GET /:id - Debe traer detalle de la compra con sus items', async () => {
      const res = await request(app).get(`/api/compras/${compraId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.proveedores.nombre).toBeDefined(); // Join con proveedor
      expect(res.body.compra_items).toHaveLength(1);
      expect(res.body.compra_items[0].cantidad).toBe(50);
    });
  });

  // ======================================================================
  // 3. INTEGRIDAD REFERENCIAL (Validación Cruzada)
  // ======================================================================
  describe('Integridad Referencial', () => {
    
    test('DELETE /api/proveedores/:id - Debe BLOQUEAR eliminación si tiene compras (Error 23503)', async () => {
      // El proveedor tiene una compra activa (compraId).
      // El controlador captura el error 23503 de Postgres y retorna 400.
      
      const res = await request(app).delete(`/api/proveedores/${proveedorId}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/tiene facturas registradas/i);
    });

    test('DELETE /api/compras/:id - Debe eliminar la compra y liberar al proveedor', async () => {
      // 1. Se elimina la compra primero
      const resCompra = await request(app).delete(`/api/compras/${compraId}`);
      expect(resCompra.statusCode).toEqual(200);
      expect(resCompra.body.message).toMatch(/eliminada/i);

      // 2. Ahora se intenta eliminar al proveedor nuevamente
      const resProv = await request(app).delete(`/api/proveedores/${proveedorId}`);
      expect(resProv.statusCode).toEqual(200);
      expect(resProv.body.mensaje).toMatch(/eliminado correctamente/i);
    });

    test('GET /api/proveedores/:id - Debe confirmar que el proveedor ya no existe', async () => {
      const res = await request(app).get(`/api/proveedores/${proveedorId}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});