const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabase');

// ----------------------------------------------------------------------
// MOCK DE MIDDLEWARE (Estrategia Stateless)
// En lugar de depender de variables externas, este mock decodifica 
// directamente el objeto JSON que se inyecta en el header Authorization.
// Esto asegura que el controlador siempre reciba el usuario correcto.
// ----------------------------------------------------------------------
jest.mock('../../src/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'No token' });
      
      const tokenString = authHeader.split('Bearer ')[1];
      if (!tokenString) return res.status(401).json({ error: 'Token format invalid' });
      
      // Se parsea el JSON inyectado en el test
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

describe('Integración - Transacciones y Fidelización (Pedidos y Cupones)', () => {
  // Variables globales para referencias de IDs
  let adminId, clienteId;
  let productoId, ingredienteId, unidadId, categoriaId;
  let cuponId, pedidoId;

  // Tokens falsos que contendrán la info del usuario
  let tokenAdmin, tokenCliente;

  // Datos semilla para lógica de negocio
  const precioProducto = 1000;
  const stockInicialProd = 20;
  const stockInicialIng = 100;
  const consumoReceta = 2; // Cada producto consume 2 ingredientes

  /**
   * PREPARACIÓN DEL ENTORNO (Setup)
   * Se crean usuarios reales en Auth para satisfacer el Trigger de la DB,
   * y se prepara el inventario necesario para realizar pedidos.
   */
  beforeAll(async () => {
    // ---------------------------------------------------------------
    // 1. CREAR USUARIO ADMIN
    // ---------------------------------------------------------------
    const emailAdmin = `admin.transacciones.${Date.now()}@test.com`;
    const { data: authAdmin, error: errAdmin } = await supabase.auth.signUp({
      email: emailAdmin,
      password: 'password123',
      options: {
        // IMPORTANTE: Metadatos requeridos por el Trigger de la DB
        data: {
          nombre: 'Admin',
          apellido: 'Test',
          telefono: '88888888',
          direccion: 'Oficina Central'
        }
      }
    });
    if (errAdmin) throw errAdmin;
    adminId = authAdmin.user.id;

    // Se asegura el rol de admin en la tabla perfiles
    await supabase.from('perfiles').upsert({
      id: adminId,
      rol: 'admin',
      email: emailAdmin,
      nombre: 'Admin',
      apellido: 'Test',
      telefono: '88888888'
    });

    // Se genera el token mock con los datos del admin
    tokenAdmin = `Bearer ${JSON.stringify({ id: adminId, rol: 'admin', email: emailAdmin })}`;

    // ---------------------------------------------------------------
    // 2. CREAR USUARIO CLIENTE
    // ---------------------------------------------------------------
    const emailCliente = `cliente.transacciones.${Date.now()}@test.com`;
    const { data: authCliente, error: errCliente } = await supabase.auth.signUp({
      email: emailCliente,
      password: 'password123',
      options: {
        data: {
          nombre: 'Cliente',
          apellido: 'Comprador',
          telefono: '77777777',
          direccion: 'Casa Cliente'
        }
      }
    });
    if (errCliente) throw errCliente;
    clienteId = authCliente.user.id;

    // Se asegura el rol de cliente
    await supabase.from('perfiles').upsert({
      id: clienteId,
      rol: 'cliente',
      email: emailCliente,
      nombre: 'Cliente',
      apellido: 'Comprador',
      telefono: '77777777'
    });

    tokenCliente = `Bearer ${JSON.stringify({ id: clienteId, rol: 'cliente', email: emailCliente })}`;

    // ---------------------------------------------------------------
    // 3. ESTRUCTURA DE INVENTARIO
    // ---------------------------------------------------------------
    // Crear Unidad
    const { data: uni } = await supabase.from('unidades_medida')
      .insert({ nombre: `Unidad T ${Date.now()}`, abreviatura: 'ut' })
      .select().single();
    unidadId = uni.id;
    
    // Crear Ingrediente
    const { data: ing } = await supabase.from('ingredientes')
      .insert({ 
        nombre: `Ingrediente T ${Date.now()}`, 
        unidad_id: unidadId, 
        stock_actual: stockInicialIng,
        es_ilimitado: false
      })
      .select().single();
    ingredienteId = ing.id;

    // Crear Categoría
    const { data: cat } = await supabase.from('categorias')
      .insert({ nombre: `Cat T ${Date.now()}`, descripcion: 'Desc' })
      .select().single();
    categoriaId = cat.id;

    // Crear Producto
    const { data: prod } = await supabase.from('productos')
      .insert({ 
        nombre: `Producto T ${Date.now()}`, 
        precio: precioProducto, 
        categoria_id: categoriaId, 
        stock_actual: stockInicialProd 
      })
      .select().single();
    productoId = prod.id;

    // 4. Crear Receta (Vincular Producto con Ingrediente)
    await supabase.from('producto_ingredientes').insert({
      producto_id: productoId, 
      ingrediente_id: ingredienteId, 
      cantidad_necesaria: consumoReceta
    });
  });

  /**
   * LIMPIEZA (Teardown)
   * Se eliminan los datos en orden inverso para respetar integridad referencial.
   */
  afterAll(async () => {
    // 1. Datos transaccionales
    if (pedidoId) {
      // Borrar detalle primero si no hay CASCADE, pero pedido suele tener CASCADE
      await supabase.from('detalle_pedidos').delete().eq('pedido_id', pedidoId);
      await supabase.from('pedidos').delete().eq('id', pedidoId);
    }
    if (cuponId) await supabase.from('cupones').delete().eq('id', cuponId);
    
    // 2. Datos de inventario
    if (productoId) {
      await supabase.from('producto_ingredientes').delete().eq('producto_id', productoId);
      await supabase.from('productos').delete().eq('id', productoId);
    }
    if (ingredienteId) await supabase.from('ingredientes').delete().eq('id', ingredienteId);
    if (categoriaId) await supabase.from('categorias').delete().eq('id', categoriaId);
    if (unidadId) await supabase.from('unidades_medida').delete().eq('id', unidadId);
    
    // 3. Usuarios (Perfiles)
    // Nota: Auth Users no se pueden borrar sin service_role key, pero limpia perfiles
    if (adminId) await supabase.from('perfiles').delete().eq('id', adminId);
    if (clienteId) await supabase.from('perfiles').delete().eq('id', clienteId);
  });

  // ======================================================================
  // 1. GESTIÓN DE CUPONES (CuponController)
  // ======================================================================
  describe('Módulo de Cupones', () => {
    
    test('POST /api/cupones - Admin crea un cupón de descuento', async () => {
      const nuevoCupon = {
        codigo: 'DESCUENTO10',
        descuento_porcentaje: 10,
        activo: true
      };

      const res = await request(app)
        .post('/api/cupones')
        .set('Authorization', tokenAdmin)
        .send(nuevoCupon);

      expect(res.statusCode).toEqual(201);
      expect(res.body.cupon.codigo).toBe('DESCUENTO10');
      cuponId = res.body.cupon.id;
    });

    test('POST /api/cupones/validar - Cliente valida un cupón existente', async () => {
      const res = await request(app)
        .post('/api/cupones/validar')
        // Endpoint público según rutas, pero si pide token, el mock lo maneja
        .send({ codigo: 'descuento10' }); // Prueba case-insensitive

      expect(res.statusCode).toEqual(200);
      expect(res.body.mensaje).toMatch(/cupón aplicado/i);
      expect(res.body.descuento).toBe(10);
    });

    test('POST /api/cupones/validar - Debe rechazar código inexistente', async () => {
      const res = await request(app)
        .post('/api/cupones/validar')
        .send({ codigo: 'FAKE123' });

      expect(res.statusCode).toEqual(404);
    });
  });

  // ======================================================================
  // 2. CREACIÓN DE PEDIDOS (PedidosController)
  // ======================================================================
  describe('Creación de Pedidos', () => {

    test('POST /api/pedidos - Cliente crea pedido con stock suficiente', async () => {
      const payload = {
        items: [
          { id: productoId, cantidad: 5 } // Pedimos 5
        ],
        cupon_id: cuponId,
        datos_entrega: {
          direccion: 'Casa 123',
          telefono: '88888888'
        }
      };

      const res = await request(app)
        .post('/api/pedidos')
        .set('Authorization', tokenCliente)
        .send(payload);

      expect(res.statusCode).toEqual(201);
      expect(res.body.mensaje).toMatch(/pedido creado/i);
      
      const pedido = res.body.pedido;
      pedidoId = pedido.id;

      // Verificación de cálculos financieros
      const subtotalEsperado = 5 * precioProducto; // 5000
      const descuentoEsperado = subtotalEsperado * 0.10; // 500
      const totalEsperado = subtotalEsperado - descuentoEsperado; // 4500

      expect(pedido.subtotal).toBe(subtotalEsperado);
      expect(pedido.total).toBe(totalEsperado);
    });

    test('POST /api/pedidos - Debe rechazar pedido si excede el stock disponible', async () => {
      const payload = {
        items: [{ id: productoId, cantidad: 100 }], // Pide más de lo que hay (20)
        datos_entrega: { direccion: 'Test', telefono: '88888888' }
      };

      const res = await request(app)
        .post('/api/pedidos')
        .set('Authorization', tokenCliente)
        .send(payload);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/stock insuficiente/i);
    });
  });

  // ======================================================================
  // 3. CONFIRMACIÓN DE PAGO (Impacto en Inventario)
  // ======================================================================
  describe('Confirmación de Pago y Descuento de Stock', () => {
    
    test('POST /:id/confirmar-pago - Debe confirmar pedido y descontar inventario', async () => {
      const res = await request(app)
        .post(`/api/pedidos/${pedidoId}/confirmar-pago`)
        .set('Authorization', tokenCliente)
        .send({ comprobante_url: 'http://bucket/comprobante.jpg' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.estado).toBe('Confirmado');

      // VERIFICACIÓN DE INVENTARIO EN DB
      
      // 1. Producto Terminado
      // Stock Inicial: 20. Vendido: 5. Quedan: 15.
      const { data: prod } = await supabase.from('productos')
        .select('stock_actual').eq('id', productoId).single();
      expect(prod.stock_actual).toBe(15);

      // 2. Ingredientes (Receta)
      // Stock Inicial: 100. Consumo: 5 productos * 2 receta = 10. Quedan: 90.
      const { data: ing } = await supabase.from('ingredientes')
        .select('stock_actual').eq('id', ingredienteId).single();
      expect(ing.stock_actual).toBe(90);
    });

    test('GET /mis-pedidos - Cliente debe ver su historial actualizado', async () => {
      const res = await request(app)
        .get('/api/pedidos/mis-pedidos')
        .set('Authorization', tokenCliente);

      expect(res.statusCode).toEqual(200);
      const pedidoEnLista = res.body.find(p => p.id === pedidoId);
      
      expect(pedidoEnLista).toBeDefined();
      expect(pedidoEnLista.estado_id).toBe(2); // 2 = Confirmado
    });
  });

  // ======================================================================
  // 4. GESTIÓN ADMINISTRATIVA DE PEDIDOS
  // ======================================================================
  describe('Administración de Pedidos', () => {
    
    test('GET /admin/todos - Admin debe ver todos los pedidos', async () => {
      const res = await request(app)
        .get('/api/pedidos/admin/todos')
        .set('Authorization', tokenAdmin);
      
      expect(res.statusCode).toEqual(200);
      // Verifica que el pedido creado esté en la lista
      expect(res.body.some(p => p.id === pedidoId)).toBe(true);
    });

    test('PUT /:id/estado - Admin cambia estado del pedido', async () => {
      // Cambiar a estado 3 (ej: En Preparación)
      const res = await request(app)
        .put(`/api/pedidos/${pedidoId}/estado`)
        .set('Authorization', tokenAdmin)
        .send({ estado_id: 3 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.mensaje).toMatch(/actualizado correctamente/i);
    });

    test('DELETE /:id - Admin intenta eliminar pedido procesado (Debe fallar)', async () => {
      // El controlador bloquea eliminar pedidos que no sean "Pendientes(1)" o "Cancelados(6)"
      // El pedido actual está en estado 3 (Confirmado/Preparación).
      
      const res = await request(app)
        .delete(`/api/pedidos/${pedidoId}`)
        .set('Authorization', tokenAdmin);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/solo se pueden eliminar pedidos pendientes/i);
    });
  });
});