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
const validarDisponibilidadMasiva = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No hay items para validar." });
  }

  try {
    const ids = items.map((item) => item.id);

    // 1. Obtener recetas y stock de todos los productos y sus ingredientes
    const { data: recetas, error: errorRecetas } = await supabase
      .from("producto_ingredientes")
      .select(
        `
        producto_id,
        ingrediente_id,
        cantidad_necesaria,
        productos ( id, nombre, stock_actual ),
        ingredientes ( id, nombre, stock_actual, es_ilimitado )
      `,
      )
      .in("producto_id", ids);

    if (errorRecetas) throw errorRecetas;

    // 2. Agrupar datos para cálculos rápidos
    const infoIngredientes = {};
    const infoProductos = {};

    recetas.forEach((receta) => {
      infoIngredientes[receta.ingrediente_id] = receta.ingredientes;
      infoProductos[receta.producto_id] = receta.productos;
    });

    const disponibilidadReal = {};
    const conflictos = [];

    // 3. CÁLCULO DE CAPACIDAD MÁXIMA POR PRODUCTO
    ids.forEach((prodId) => {
      const producto = infoProductos[prodId];
      if (!producto) return;

      // Iniciamos con el stock físico del producto terminado
      let maximoFabricable = producto.stock_actual || 0;

      // Evaluamos cada ingrediente de la receta para este producto específico
      const recetaDelProducto = recetas.filter((r) => r.producto_id === prodId);

      recetaDelProducto.forEach((r) => {
        if (r.ingredientes.es_ilimitado) {
          return;
        }

        const stockDisponibleIng = r.ingredientes.stock_actual || 0;
        const cantidadNecesaria = r.cantidad_necesaria || 1;

        // Cuántos productos se pueden hacer con este ingrediente específico
        const posibleConEsteIng = Math.floor(
          stockDisponibleIng / cantidadNecesaria,
        );

        // El "Reactivo Limitante": El mínimo entre el stock del producto y sus ingredientes
        maximoFabricable = Math.min(maximoFabricable, posibleConEsteIng);
      });

      // Guardamos el máximo absoluto posible
      disponibilidadReal[prodId] = maximoFabricable < 0 ? 0 : maximoFabricable;

      // 4. DETECCIÓN DE CONFLICTOS
      const itemEnCarrito = items.find((i) => i.id === prodId);
      if (itemEnCarrito && itemEnCarrito.cantidad > maximoFabricable) {
        conflictos.push({
          id: prodId,
          nombre: producto.nombre,
          cantidadSolicitada: itemEnCarrito.cantidad,
          cantidadDisponible: disponibilidadReal[prodId],
        });
      }
    });

    // 5. RESPUESTA FINAL
    res.status(200).json({
      valido: conflictos.length === 0,
      conflictos,
      disponibilidadReal, // Ahora contiene el stock total real (ej: 11), no el limitado (ej: 4)
    });
  } catch (error) {
    console.error("Error al validar disponibilidad masiva:", error);
    res.status(500).json({ error: "Error interno al validar el inventario." });
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
 * ELIMINAR PRODUCTO Y ARCHIVOS (Solo Admin)
 * Sincroniza la limpieza de la base de datos con el borrado físico en el Bucket.
 */
const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. OBTENER LAS URLs: Antes de borrar nada, consultamos qué imágenes tiene el producto
    const { data: imagenes, error: errorConsultar } = await supabase
      .from("producto_imagenes")
      .select("url")
      .eq("producto_id", id);

    if (errorConsultar) throw errorConsultar;

    // 2. BORRADO FÍSICO EN STORAGE: Si el producto tiene imágenes, las eliminamos del bucket
    if (imagenes && imagenes.length > 0) {
      // Extraemos el nombre del archivo de la URL pública (ej: "abc123.jpg")
      // Las URLs de Supabase terminan siempre en /nombre-del-archivo
      const pathsParaBorrar = imagenes.map((img) => {
        const partes = img.url.split("/");
        return partes[partes.length - 1];
      });

      // Ejecutamos el borrado masivo en el bucket 'productos'
      const { error: errorStorage } = await supabase.storage
        .from("productos")
        .remove(pathsParaBorrar);

      if (errorStorage) {
        // Logueamos pero no detenemos el proceso por si el archivo ya no existía físicamente
        console.warn(
          "Aviso: Algunos archivos no se pudieron borrar del Storage:",
          errorStorage,
        );
      }
    }

    // 3. BORRADO EN BASE DE DATOS: Finalmente eliminamos el producto
    // Esto disparará la eliminación en cascada de la tabla producto_imagenes
    const { error: errorDB } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);

    if (errorDB) throw errorDB;

    res.status(200).json({
      mensaje:
        "Producto y sus archivos asociados han sido eliminados del sistema.",
    });
  } catch (error) {
    console.error("Error crítico en eliminarProducto:", error);
    res.status(500).json({
      error:
        "Este producto no puede ser borrado actualmente porque forma parte de pedidos que se encuentran activos. Resuelva primero el estado de dichos pedidos.",
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
