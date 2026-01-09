const supabase = require("../config/supabase");

/**
 * LISTAR CATEGORÍAS (Admin)
 * Trae TODAS las categorías incluyendo las inactivas.
 */
const listarCategorias = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*, productos(count)")
      .order("nombre", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al listar categorías:", error);
    res.status(500).json({ error: "Error al obtener las categorías." });
  }
};

/**
 * LISTAR CATEGORÍAS ACTIVAS (Público)
 * Solo trae las categorías con activo = true para el catálogo del cliente.
 */
const listarCategoriasActivas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, descripcion")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al listar categorías activas:", error);
    res.status(500).json({ error: "Error al obtener las categorías." });
  }
};

/**
 * OBTENER UNA CATEGORÍA (Público/Admin)
 * Útil para precargar el formulario de edición.
 */
const obtenerCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("id", id)
      .single();

    if (error)
      return res.status(404).json({ error: "Categoría no encontrada." });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar la categoría." });
  }
};

/**
 * CREAR CATEGORÍA (Solo Admin)
 */
const crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es obligatorio." });
  }

  try {
    const { data, error } = await supabase
      .from("categorias")
      .insert([{ nombre, descripcion, activo: true }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: `La categoría "${nombre}" ya existe.` });
      }
      throw error;
    }

    res
      .status(201)
      .json({ mensaje: "Categoría creada con éxito.", categoria: data });
  } catch (error) {
    console.error("Error creando categoría:", error);
    res.status(500).json({ error: "No se pudo crear la categoría." });
  }
};

/**
 * ACTUALIZAR CATEGORÍA (Solo Admin)
 */
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  try {
    const { data, error } = await supabase
      .from("categorias")
      .update({ nombre, descripcion })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: `La categoría "${nombre}" ya existe. Elige otro nombre.`,
        });
      }
      throw error;
    }

    res
      .status(200)
      .json({ mensaje: "Categoría actualizada.", categoria: data });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res
      .status(500)
      .json({ error: "Error interno al actualizar la categoría." });
  }
};

/**
 * TOGGLE ESTADO ACTIVO (Solo Admin)
 * Activa o desactiva una categoría sin eliminarla.
 */
const toggleCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener estado actual
    const { data: categoria, error: fetchError } = await supabase
      .from("categorias")
      .select("activo, nombre")
      .eq("id", id)
      .single();

    if (fetchError || !categoria) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    // 2. Invertir estado
    const nuevoEstado = !categoria.activo;

    const { data, error } = await supabase
      .from("categorias")
      .update({ activo: nuevoEstado })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      mensaje: `Categoría "${categoria.nombre}" ${
        nuevoEstado ? "activada" : "desactivada"
      }.`,
      categoria: data,
    });
  } catch (error) {
    console.error("Error al cambiar estado de categoría:", error);
    res.status(500).json({ error: "Error al actualizar el estado." });
  }
};

/**
 * ELIMINAR CATEGORÍA (Solo Admin)
 * Nota: Los productos asociados quedarán con categoria_id = NULL
 */
const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("categorias").delete().eq("id", id);

    if (error) throw error;

    res.status(200).json({ mensaje: "Categoría eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la categoría." });
  }
};

module.exports = {
  listarCategorias,
  listarCategoriasActivas,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  toggleCategoria,
  eliminarCategoria,
};
