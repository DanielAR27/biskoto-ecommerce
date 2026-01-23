const supabase = require("../config/supabase");

/**
 * LISTAR COMENTARIOS POR NOTICIA
 * Público - Solo comentarios aprobados
 * Admin - Todos los comentarios
 */
const listarComentariosPorNoticia = async (req, res) => {
  const { noticiaId } = req.params;

  try {
    // Primero obtener comentarios
    let query = supabase
      .from("comentarios")
      .select("*")
      .eq("noticia_id", parseInt(noticiaId))
      .order("fecha", { ascending: false });

    // Si no es admin, solo mostrar aprobados
    if (!req.user || req.user.rol !== "admin") {
      query = query.eq("estado", "aprobado");
    }

    const { data: comentarios, error } = await query;

    if (error) throw error;

    // Luego obtener información de usuarios para cada comentario
    const comentariosConUsuario = await Promise.all(
      comentarios.map(async (comentario) => {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("nombre, apellido, email")
          .eq("id", comentario.usuario_id)
          .single();

        return {
          ...comentario,
          perfiles: perfil || { nombre: "Usuario", apellido: "Desconocido" },
        };
      }),
    );

    res.status(200).json(comentariosConUsuario);
  } catch (error) {
    console.error("Error al listar comentarios:", error);
    res.status(500).json({ error: "Error al obtener los comentarios" });
  }
};

/**
 * LISTAR TODOS LOS COMENTARIOS (Solo Admin)
 */
const listarTodosComentarios = async (req, res) => {
  try {
    // Obtener comentarios
    const { data: comentarios, error } = await supabase
      .from("comentarios")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw error;

    // ✅ Enriquecer con info de usuario y noticia
    const comentariosEnriquecidos = await Promise.all(
      comentarios.map(async (comentario) => {
        // Obtener perfil
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("nombre, apellido, email")
          .eq("id", comentario.usuario_id)
          .single();

        // ✅ Obtener noticia
        const { data: noticia } = await supabase
          .from("noticias")
          .select("id, titulo, categoria")
          .eq("id", comentario.noticia_id)
          .single();

        return {
          ...comentario,
          perfiles: perfil || {
            nombre: "Usuario",
            apellido: "Desconocido",
            email: "N/A",
          },
          noticias: noticia || null, // null si fue eliminada
        };
      }),
    );

    res.status(200).json(comentariosEnriquecidos);
  } catch (error) {
    console.error("Error al listar comentarios:", error);
    res.status(500).json({ error: "Error al obtener los comentarios" });
  }
};

/**
 * CREAR COMENTARIO
 * Usuario logueado puede comentar
 * Comentario queda en estado "pendiente" hasta que admin apruebe
 */
const crearComentario = async (req, res) => {
  const { noticia_id, contenido } = req.body;
  const usuario_id = req.user.id;

  // Validaciones
  if (!noticia_id || !contenido || !contenido.trim()) {
    return res
      .status(400)
      .json({ error: "Noticia y contenido son obligatorios" });
  }

  try {
    // Verificar que la noticia existe
    const { data: noticia, error: errorNoticia } = await supabase
      .from("noticias")
      .select("id")
      .eq("id", parseInt(noticia_id))
      .single();

    if (errorNoticia) {
      return res.status(404).json({ error: "Noticia no encontrada" });
    }

    // Crear comentario
    const { data, error } = await supabase
      .from("comentarios")
      .insert([
        {
          noticia_id: parseInt(noticia_id),
          usuario_id,
          contenido: contenido.trim(),
          estado: "aprobado",
          fecha: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json({
      mensaje: "Comentario publicado exitosamente.",
      comentario: data,
    });
  } catch (error) {
    console.error("Error al crear comentario:", error);
    res.status(500).json({ error: "Error al crear el comentario" });
  }
};

/**
 * ACTUALIZAR COMENTARIO
 * Usuario solo puede editar su propio comentario
 */
const actualizarComentario = async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body;
  const usuario_id = req.user.id;

  // Validaciones
  if (!contenido || !contenido.trim()) {
    return res.status(400).json({ error: "El contenido es obligatorio" });
  }

  try {
    // Verificar que el comentario pertenece al usuario
    const { data: comentario, error: errorBusqueda } = await supabase
      .from("comentarios")
      .select("usuario_id")
      .eq("id", parseInt(id))
      .single();

    if (errorBusqueda) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    if (comentario.usuario_id !== usuario_id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para editar este comentario" });
    }

    // Actualizar
    const { data, error } = await supabase
      .from("comentarios")
      .update({
        contenido: contenido.trim(),
        estado: "aprobado",
      })
      .eq("id", parseInt(id))
      .select("*")
      .single();

    if (error) throw error;

    res.status(200).json({
      mensaje: "Comentario actualizado. Será revisado nuevamente.",
      comentario: data,
    });
  } catch (error) {
    console.error("Error al actualizar comentario:", error);
    res.status(500).json({ error: "Error al actualizar el comentario" });
  }
};

/**
 * ELIMINAR COMENTARIO
 * Usuario puede eliminar su propio comentario
 * Admin puede eliminar cualquier comentario
 */
const eliminarComentario = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;
  const es_admin = req.user.rol === "admin";

  try {
    // Verificar que el comentario existe
    const { data: comentario, error: errorBusqueda } = await supabase
      .from("comentarios")
      .select("usuario_id")
      .eq("id", parseInt(id))
      .single();

    if (errorBusqueda) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Verificar permisos
    if (!es_admin && comentario.usuario_id !== usuario_id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este comentario" });
    }

    // Eliminar
    const { error } = await supabase
      .from("comentarios")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    res.status(200).json({
      mensaje: "Comentario eliminado exitosamente",
      id: parseInt(id),
    });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    res.status(500).json({ error: "Error al eliminar el comentario" });
  }
};

/**
 * APROBAR COMENTARIO (Solo Admin)
 */
const aprobarComentario = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("comentarios")
      .update({ estado: "aprobado" })
      .eq("id", parseInt(id))
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Comentario no encontrado" });
      }
      throw error;
    }

    res.status(200).json({
      mensaje: "Comentario aprobado exitosamente",
      comentario: data,
    });
  } catch (error) {
    console.error("Error al aprobar comentario:", error);
    res.status(500).json({ error: "Error al aprobar el comentario" });
  }
};

/**
 * RECHAZAR COMENTARIO (Solo Admin)
 */
const rechazarComentario = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("comentarios")
      .update({ estado: "rechazado" })
      .eq("id", parseInt(id))
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Comentario no encontrado" });
      }
      throw error;
    }

    res.status(200).json({
      mensaje: "Comentario rechazado",
      comentario: data,
    });
  } catch (error) {
    console.error("Error al rechazar comentario:", error);
    res.status(500).json({ error: "Error al rechazar el comentario" });
  }
};

module.exports = {
  listarComentariosPorNoticia,
  listarTodosComentarios,
  crearComentario,
  actualizarComentario,
  eliminarComentario,
  aprobarComentario,
  rechazarComentario,
};
