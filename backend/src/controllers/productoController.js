const supabase = require("../config/supabase");

/**
 * LISTAR PRODUCTOS CATÁLOGO (Con imágenes)
 * Endpoint para la vista de cliente. Soporta paginación, BÚSQUEDA y FILTRO POR MÚLTIPLES CATEGORÍAS.
 */
const listarProductosCatalogo = async (req, res) => {
  try {
    // 1. Extraemos los parámetros de query
    const {
      page = 1,
      limit = 20,
      search = "",
      categoria_ids = null, // MODIFICADO: Ahora recibe múltiples IDs separados por coma
    } = req.query;

    const desde = (page - 1) * limit;
    const hasta = desde + limit - 1;

    // 2. Iniciamos la consulta base
    let query = supabase
      .from("productos")
      .select(
        `
    *,
    categorias ( id, nombre ),
    producto_imagenes ( id, url, es_principal ),
    producto_ingredientes (
      cantidad_necesaria,
      ingredientes ( stock_actual, es_ilimitado )
    )
  `,
        { count: "exact" },
      )
      .eq("activo", true); // ← AGREGAR ESTA LÍNEA

    // 3. FILTRO POR MÚLTIPLES CATEGORÍAS (si se envían)
    if (categoria_ids) {
      // Convertimos el string "id1,id2,id3" a un array ["id1", "id2", "id3"]
      const idsArray = categoria_ids.split(",").map((id) => id.trim());
      // Usamos .in() para filtrar por cualquiera de las categorías seleccionadas
      query = query.in("categoria_id", idsArray);
    }

    // 4. FILTRO DE BÚSQUEDA (si existe)
    if (search) {
      query = query.ilike("nombre", `%${search}%`);
    }

    // 5. Aplicamos ordenamiento y paginación al final
    const { data, error, count } = await query
      .order("nombre", { ascending: true })
      .range(desde, hasta);

    if (error) throw error;

    res.status(200).json({
      productos: data,
      totalItems: count,
      paginaActual: parseInt(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error al listar catálogo con imágenes:", error);
    res.status(500).json({ error: "Error al obtener el catálogo completo." });
  }
};

/**
 * LISTAR PRODUCTOS ADMIN (Sin imágenes)
 * Optimizado para el panel de administración donde solo se requiere
 * la gestión de datos básicos e inventario.
 */
const listarProductosAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*, categorias ( id, nombre )")
      .order("nombre", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al listar productos (Admin):", error);
    res
      .status(500)
      .json({ error: "Error al obtener el listado administrativo." });
  }
};

/**
 * OBTENER UN PRODUCTO (Público/Admin)
 * Incluye los datos de la categoría, imágenes y RECETA CON STOCK.
 * Ahora traemos 'stock_actual' de cada ingrediente para calcular disponibilidad en el frontend.
 */
const obtenerProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("productos")
      .select(
        `
        *,
        categorias ( id, nombre ),
        producto_imagenes ( id, url, es_principal, orden ),
        producto_ingredientes (
          ingrediente_id,
          cantidad_necesaria,
          ingredientes ( 
            nombre,
            stock_actual, 
            es_ilimitado,
            unidades_medida (nombre, abreviatura)
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener detalle del producto:", error);
    res.status(500).json({ error: "Error al buscar el producto." });
  }
};

/**
 * VALIDAR DISPONIBILIDAD MASIVA (CORREGIDO)
 * Calcula la capacidad máxima real de fabricación e inventario
 * sin limitarse por la cantidad enviada por el usuario.
 */
// Busca la función validarDisponibilidadMasiva y reemplázala con esta versión mejorada:

const validarDisponibilidadMasiva = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No hay items para validar." });
  }

  try {
    const ids = items.map((item) => item.id);

    // 1. [NUEVO] Verificar existencia y estado activo de los productos
    const { data: productosInfo, error: errorInfo } = await supabase
      .from("productos")
      .select("id, nombre, activo, stock_actual")
      .in("id", ids);

    if (errorInfo) throw errorInfo;

    // Mapa para acceso rápido
    const mapaProductos = {};
    productosInfo.forEach(p => mapaProductos[p.id] = p);

    // 2. Detectar productos eliminados o inactivos
    const estadoProductos = {}; // Guardará: 'ok', 'eliminado', 'inactivo'
    
    ids.forEach(id => {
      const prod = mapaProductos[id];
      if (!prod) {
        estadoProductos[id] = 'eliminado';
      } else if (!prod.activo) {
        estadoProductos[id] = 'inactivo';
      } else {
        estadoProductos[id] = 'ok';
      }
    });

    // 3. Obtener recetas (Solo de los que están OK)
    const idsValidos = ids.filter(id => estadoProductos[id] === 'ok');
    
    let recetas = [];
    if (idsValidos.length > 0) {
      const { data: recetasData, error: errorRecetas } = await supabase
        .from("producto_ingredientes")
        .select(`
          producto_id,
          cantidad_necesaria,
          ingredientes ( stock_actual, es_ilimitado )
        `)
        .in("producto_id", idsValidos);
        
      if (errorRecetas) throw errorRecetas;
      recetas = recetasData;
    }

    // 4. Calcular disponibilidad (Lógica original optimizada)
    const disponibilidadReal = {};
    const conflictos = [];

    ids.forEach((prodId) => {
      // Si el producto no existe o está inactivo, su disponibilidad es 0
      if (estadoProductos[prodId] !== 'ok') {
        disponibilidadReal[prodId] = 0;
        conflictos.push({
          id: prodId,
          nombre: mapaProductos[prodId]?.nombre || "Producto eliminado",
          cantidadSolicitada: items.find(i => i.id === prodId).cantidad,
          cantidadDisponible: 0,
          razon: estadoProductos[prodId] // 'eliminado' o 'inactivo'
        });
        return;
      }

      const producto = mapaProductos[prodId];
      let maximoFabricable = producto.stock_actual || 0;

      // Receta del producto
      const recetaDelProducto = recetas.filter((r) => r.producto_id === prodId);

      recetaDelProducto.forEach((r) => {
        if (r.ingredientes.es_ilimitado) return;
        const stockIng = r.ingredientes.stock_actual || 0;
        const posible = Math.floor(stockIng / (r.cantidad_necesaria || 1));
        maximoFabricable = Math.min(maximoFabricable, posible);
      });

      disponibilidadReal[prodId] = maximoFabricable < 0 ? 0 : maximoFabricable;

      // Conflicto de stock
      const itemEnCarrito = items.find((i) => i.id === prodId);
      if (itemEnCarrito.cantidad > maximoFabricable) {
        conflictos.push({
          id: prodId,
          nombre: producto.nombre,
          cantidadSolicitada: itemEnCarrito.cantidad,
          cantidadDisponible: maximoFabricable,
          razon: 'stock_insuficiente'
        });
      }
    });

    res.status(200).json({
      valido: conflictos.length === 0,
      conflictos,
      disponibilidadReal,
      estadoProductos // Envia el estado explícito al frontend
    });
  } catch (error) {
    console.error("Error al validar disponibilidad:", error);
    res.status(500).json({ error: "Error al validar el inventario." });
  }
};

/**
 * CREAR PRODUCTO E IMÁGENES
 * Registra el producto y posteriormente inserta las referencias de las fotos
 * que el frontend ya subió al Bucket de Supabase.
 */
const crearProducto = async (req, res) => {
  const {
    nombre,
    precio,
    descripcion,
    categoria_id,
    stock_actual,
    imagenes,
    ingredientes,
    requiere_adelanto,
    porcentaje_adelanto,
  } = req.body;

  // 1. Validaciones de Negocio
  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({
      error: "El nombre es obligatorio y debe tener al menos 3 caracteres.",
    });
  }

  if (precio < 0) {
    return res
      .status(400)
      .json({ error: "El precio debe ser un número mayor o igual a 0." });
  }

  // Prevenir desbordamiento de enteros y errores lógicos
  if (stock_actual < 0) {
    return res.status(400).json({ error: "El stock no puede ser negativo." });
  }

  if (stock_actual > 999999) {
    return res.status(400).json({
      error: "La cantidad de stock es demasiado grande (máximo 999,999).",
    });
  }

  try {
    // 1. Insertar Producto (IGUAL)
    const { data: producto, error: productoError } = await supabase
      .from("productos")
      .insert([
        {
          nombre,
          precio,
          descripcion,
          categoria_id: categoria_id || null,
          stock_actual: stock_actual || 0,
          requiere_adelanto: requiere_adelanto || false,
          porcentaje_adelanto: porcentaje_adelanto || 50,
        },
      ])
      .select()
      .single();

    if (productoError) throw productoError;

    // 2. Insertar Imágenes (IGUAL)
    if (imagenes && imagenes.length > 0) {
      const imagenesData = imagenes.map((img) => ({
        producto_id: producto.id,
        url: img.url,
        es_principal: img.es_principal || false,
        orden: img.orden || 0,
      }));
      await supabase.from("producto_imagenes").insert(imagenesData);
    }

    // 3. NUEVO: Insertar Ingredientes (Receta)
    if (ingredientes && ingredientes.length > 0) {
      const recetaData = ingredientes.map((ing) => ({
        producto_id: producto.id,
        ingrediente_id: ing.id, // ID del ingrediente seleccionado
        cantidad_necesaria: ing.cantidad, // Cantidad que viene del frontend
      }));

      const { error: errorReceta } = await supabase
        .from("producto_ingredientes")
        .insert(recetaData);

      if (errorReceta) throw errorReceta;
    }

    res
      .status(201)
      .json({ mensaje: "Producto creado exitosamente.", producto });
  } catch (error) {
    console.error("Error en crearProducto:", error);
    res.status(500).json({ error: "Error interno al procesar el registro." });
  }
};

/**
 * ACTUALIZAR PRODUCTO (Solo Admin)
 * Incluye validaciones de integridad de datos y límites de negocio.
 */
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    precio,
    descripcion,
    categoria_id,
    stock_actual,
    imagenes,
    ingredientes,
    requiere_adelanto,
    porcentaje_adelanto,
  } = req.body;

  // 1. Validaciones de Integridad
  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({
      error: "El nombre es obligatorio y debe tener al menos 3 caracteres.",
    });
  }

  // Validación de precio (No permite negativos ni gratis)
  if (precio < 0) {
    return res.status(400).json({
      error: "El precio debe ser un número mayor o igual a 0.",
    });
  }

  // Validación de stock (Límite para evitar desbordamiento de INTEGER en SQL)
  if (stock_actual < 0) {
    return res.status(400).json({
      error: "El stock no puede ser negativo.",
    });
  }

  if (stock_actual > 999999) {
    return res.status(400).json({
      error: "El stock excede el límite permitido (máximo 999,999).",
    });
  }

  try {
    // 1. OBTENER IMÁGENES ACTUALES: Consultamos qué hay en la DB antes de borrar
    const { data: imagenesViejas, error: errorGet } = await supabase
      .from("producto_imagenes")
      .select("url")
      .eq("producto_id", id);

    if (errorGet) throw errorGet;

    // 2. IDENTIFICAR QUÉ BORRAR: Comparamos las viejas contra las nuevas que envió el frontend
    // Si una URL vieja NO está en el nuevo arreglo de 'imagenes', hay que borrar el archivo físico.
    const urlsNuevas = imagenes.map((img) => img.url);
    const imagenesParaEliminarFisicamente = imagenesViejas
      .filter((imgVieja) => !urlsNuevas.includes(imgVieja.url))
      .map((img) => img.url.split("/").pop()); // Extraemos solo el nombre del archivo

    // 3. BORRADO FÍSICO: Si hay imágenes descartadas, las quitamos del Storage
    if (imagenesParaEliminarFisicamente.length > 0) {
      const { error: errorStorage } = await supabase.storage
        .from("productos")
        .remove(imagenesParaEliminarFisicamente);

      if (errorStorage)
        console.warn(
          "No se pudieron borrar algunos archivos físicos:",
          errorStorage,
        );
    }

    // 4. ACTUALIZAR DATOS BÁSICOS
    await supabase
      .from("productos")
      .update({
        nombre,
        precio,
        descripcion,
        categoria_id: categoria_id || null,
        stock_actual,
        requiere_adelanto:
          requiere_adelanto !== undefined ? requiere_adelanto : false,
        porcentaje_adelanto:
          porcentaje_adelanto !== undefined ? porcentaje_adelanto : 50,
      })
      .eq("id", id);

    // 5. SINCRONIZAR TABLA DE IMÁGENES (Limpiar y Reinsertar)
    await supabase.from("producto_imagenes").delete().eq("producto_id", id);

    if (imagenes && imagenes.length > 0) {
      const imagenesData = imagenes.map((img) => ({
        producto_id: id,
        url: img.url,
        es_principal: img.es_principal,
        orden: img.orden,
      }));
      await supabase.from("producto_imagenes").insert(imagenesData);
    }

    // 6. NUEVO: SINCRONIZAR INGREDIENTES (Receta)
    // Solo tocamos esto si el frontend envía el campo 'ingredientes'
    if (ingredientes) {
      // Borramos la receta anterior
      await supabase
        .from("producto_ingredientes")
        .delete()
        .eq("producto_id", id);

      // Insertamos la nueva si hay items
      if (ingredientes.length > 0) {
        const recetaData = ingredientes.map((ing) => ({
          producto_id: id,
          ingrediente_id: ing.id,
          cantidad_necesaria: ing.cantidad,
        }));

        const { error: errorReceta } = await supabase
          .from("producto_ingredientes")
          .insert(recetaData);

        if (errorReceta) throw errorReceta;
      }
    }

    res
      .status(200)
      .json({ mensaje: "Producto, receta y archivos actualizados." });
  } catch (error) {
    console.error("Error en actualización:", error);
    res.status(500).json({ error: "Error al procesar la actualización." });
  }
};

/**
 * ELIMINAR PRODUCTO (INTELIGENTE)
 * - Si tiene ventas reales (Confirmado, Entregado, etc): BLOQUEA (Sugiere desactivar).
 * - Si solo está en carritos abandonados (Pendiente) o cancelados: LIMPIA Y BORRA.
 */
const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. VERIFICAR VENTAS REALES
    // Busca si existe en detalles de pedidos que NO sean (1=Pendiente o 6=Cancelado)
    // Nota: Usamos !inner para filtrar basado en la tabla relacionada 'pedidos'
    const { count, error: errorCheck } = await supabase
      .from("detalle_pedidos")
      .select("id, pedidos!inner(estado_id)", { count: "exact", head: true })
      .eq("producto_id", id)
      .neq("pedidos.estado_id", 1) // Ignora Pendientes
      .neq("pedidos.estado_id", 6); // Ignora Cancelados

    if (errorCheck) throw errorCheck;

    if (count > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar: Este producto tiene ventas históricas reales. Te recomendamos usar la opción de 'Desactivar' para ocultarlo del catálogo sin perder la contabilidad.",
      });
    }

    // 2. LIMPIEZA DE BASURA (Carritos abandonados)
    // Si se llega aquí, solo está en pedidos Pendientes o Cancelados.
    // Hay que borrar esas referencias primero para liberar la restricción (Foreign Key).
    await supabase
      .from("detalle_pedidos")
      .delete()
      .eq("producto_id", id);

    // 3. OBTENER LAS URLs DE IMÁGENES (Para borrar archivos físicos)
    const { data: imagenes } = await supabase
      .from("producto_imagenes")
      .select("url")
      .eq("producto_id", id);

    // 4. BORRADO FÍSICO EN STORAGE
    if (imagenes && imagenes.length > 0) {
      const pathsParaBorrar = imagenes.map((img) => {
        const partes = img.url.split("/");
        return partes[partes.length - 1];
      });

      await supabase.storage
        .from("productos")
        .remove(pathsParaBorrar);
    }

    // 5. BORRADO FINAL DEL PRODUCTO
    const { error: errorDB } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);

    if (errorDB) throw errorDB;

    res.status(200).json({
      mensaje: "Producto eliminado (se limpiaron referencias en carritos abandonados).",
    });

  } catch (error) {
    console.error("Error en eliminarProducto:", error);
    res.status(500).json({
      error: "Error interno al intentar eliminar el producto.",
    });
  }
};

/**
 * Verificar si algún producto requiere adelanto
 */
const verificarAdelanto = async (req, res) => {
  const { product_ids } = req.body;

  if (!product_ids || product_ids.length === 0) {
    return res.status(400).json({ error: "Se requiere lista de productos" });
  }

  try {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, requiere_adelanto, porcentaje_adelanto")
      .in("id", product_ids);

    if (error) throw error;

    const productosConAdelanto = data.filter((p) => p.requiere_adelanto);
    const requiereAdelanto = productosConAdelanto.length > 0;

    // Obtener el porcentaje más alto si hay múltiples productos
    let porcentajeAdelanto = 50; // Default
    if (requiereAdelanto) {
      const porcentajes = productosConAdelanto.map(
        (p) => p.porcentaje_adelanto || 50,
      );
      porcentajeAdelanto = Math.max(...porcentajes);
    }

    res.status(200).json({
      requiere_adelanto: requiereAdelanto,
      porcentaje_adelanto: porcentajeAdelanto,
      productos_con_adelanto: productosConAdelanto,
    });
  } catch (error) {
    console.error("Error verificando adelanto:", error);
    res.status(500).json({ error: "Error al verificar adelanto" });
  }
};

/**
 * Toggle del estado activo de un producto
 */
const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const { data: producto, error: fetchError } = await supabase
      .from("productos")
      .select("activo")
      .eq("id", id)
      .single();

    if (fetchError || !producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Cambiar al estado opuesto
    const nuevoEstado = !producto.activo;

    const { data, error } = await supabase
      .from("productos")
      .update({ activo: nuevoEstado })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar visibilidad:", error);
      return res.status(500).json({ error: "Error al actualizar visibilidad" });
    }

    res.json({
      message: `Producto ${
        nuevoEstado ? "activado" : "desactivado"
      } exitosamente`,
      producto: data,
    });
  } catch (error) {
    console.error("Error en toggleActivo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  listarProductosCatalogo,
  listarProductosAdmin,
  obtenerProducto,
  validarDisponibilidadMasiva,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  verificarAdelanto,
  toggleActivo,
};
