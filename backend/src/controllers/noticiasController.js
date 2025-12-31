const supabase = require("../config/supabase");

/**
 * Controlador de Noticias
 * Gestión CRUD completa de noticias del blog
 */

/**
 * Crear una nueva noticia (Solo Admin)
 */
const crearNoticia = async (req, res) => {
  try {
    const { titulo, contenido, extracto, imagen_url, categoria, activo } =
      req.body;
    const autor_id = req.user.id;

    // Validaciones
    if (!titulo || !contenido) {
      return res
        .status(400)
        .json({ error: "Título y contenido son obligatorios" });
    }

    // Generar slug único a partir del título
    let slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, "-"); // Espacios a guiones

    // Verificar si el slug ya existe
    const { data: existente } = await supabase
      .from("noticias")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existente) {
      slug = `${slug}-${Date.now()}`;
    }

    // Crear noticia
    const { data, error } = await supabase
      .from("noticias")
      .insert([
        {
          titulo,
          slug,
          contenido,
          extracto,
          imagen_url,
          categoria: categoria || "general",
          autor_id,
          activo: activo !== undefined ? activo : true,
        },
      ])
      .select("*") // 👈 CORREGIDO - SIN JOINS
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Noticia creada exitosamente",
      noticia: data,
    });
  } catch (error) {
    console.error("Error al crear noticia:", error);
    res.status(500).json({ error: "Error al crear la noticia" });
  }
};

/**
 * Listar todas las noticias (Público: solo activas, Admin: todas)
 */
const listarNoticias = async (req, res) => {
  try {
    const { categoria, activo } = req.query;
    const esAdmin = req.user?.rol === "admin";

    let query = supabase
      .from("noticias")
      .select("*")
      .order("fecha_publicacion", { ascending: false });

    // Filtros
    if (categoria) {
      query = query.eq("categoria", categoria);
    }

    // Solo mostrar activas al público
    if (!esAdmin || activo === "true") {
      query = query.eq("activo", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error al listar noticias:", error);
    res.status(500).json({ error: "Error al obtener noticias" });
  }
};

/**
 * Obtener una noticia por ID o slug
 */
const obtenerNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const esAdmin = req.user?.rol === "admin";

    // Determinar si es ID numérico o slug
    const esNumerico = !isNaN(id);

    let query = supabase.from("noticias").select("*");

    if (esNumerico) {
      query = query.eq("id", parseInt(id));
    } else {
      query = query.eq("slug", id);
    }

    // Solo mostrar activas al público
    if (!esAdmin) {
      query = query.eq("activo", true);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Noticia no encontrada" });
      }
      throw error;
    }

    // Incrementar vistas
    await supabase
      .from("noticias")
      .update({ vistas: (data.vistas || 0) + 1 })
      .eq("id", data.id);

    res.json(data);
  } catch (error) {
    console.error("Error al obtener noticia:", error);
    res.status(500).json({ error: "Error al obtener la noticia" });
  }
};

/**
 * Actualizar una noticia (Solo Admin)
 */
const actualizarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, extracto, imagen_url, categoria, activo } =
      req.body;

    const updates = {};
    if (titulo !== undefined) updates.titulo = titulo;
    if (contenido !== undefined) updates.contenido = contenido;
    if (extracto !== undefined) updates.extracto = extracto;
    if (imagen_url !== undefined) updates.imagen_url = imagen_url;
    if (categoria !== undefined) updates.categoria = categoria;
    if (activo !== undefined) updates.activo = activo;

    // Si se cambia el título, regenerar slug
    if (titulo) {
      let slug = titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      // Verificar si el slug ya existe (excepto la noticia actual)
      const { data: existente } = await supabase
        .from("noticias")
        .select("id")
        .eq("slug", slug)
        .neq("id", parseInt(id))
        .single();

      if (existente) {
        slug = `${slug}-${Date.now()}`;
      }

      updates.slug = slug;
    }

    const { data, error } = await supabase
      .from("noticias")
      .update(updates)
      .eq("id", parseInt(id))
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Noticia no encontrada" });
      }
      throw error;
    }

    res.json({
      message: "Noticia actualizada exitosamente",
      noticia: data,
    });
  } catch (error) {
    console.error("Error al actualizar noticia:", error);
    res.status(500).json({ error: "Error al actualizar la noticia" });
  }
};

/**
 * Eliminar una noticia (Solo Admin)
 */
const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("noticias")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    res.json({ message: "Noticia eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar noticia:", error);
    res.status(500).json({ error: "Error al eliminar la noticia" });
  }
};

module.exports = {
  crearNoticia,
  listarNoticias,
  obtenerNoticia,
  actualizarNoticia,
  eliminarNoticia,
};
