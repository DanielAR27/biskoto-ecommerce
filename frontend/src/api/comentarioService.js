import api from "./axiosConfig";

/**
 * Obtener comentarios de una noticia
 * @param {Number} noticiaId - ID de la noticia
 * @returns {Promise<Array>} Lista de comentarios
 */
export const getComentariosPorNoticia = async (noticiaId) => {
  const response = await api.get(`/comentarios/noticia/${noticiaId}`);
  return response.data;
};

/**
 * Obtener todos los comentarios (Solo Admin)
 * @returns {Promise<Array>} Lista de todos los comentarios
 */
export const getTodosComentarios = async () => {
  const response = await api.get("/comentarios");
  return response.data;
};

/**
 * Crear un comentario en una noticia
 * @param {Object} comentarioData - Datos del comentario
 * @returns {Promise<Object>} Comentario creado
 */
export const crearComentario = async (comentarioData) => {
  const response = await api.post("/comentarios", comentarioData);
  return response.data;
};

/**
 * Actualizar un comentario propio
 * @param {Number} id - ID del comentario
 * @param {Object} comentarioData - Datos a actualizar
 * @returns {Promise<Object>} Comentario actualizado
 */
export const actualizarComentario = async (id, comentarioData) => {
  const response = await api.put(`/comentarios/${id}`, comentarioData);
  return response.data;
};

/**
 * Eliminar un comentario propio
 * @param {Number} id - ID del comentario
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarComentario = async (id) => {
  const response = await api.delete(`/comentarios/${id}`);
  return response.data;
};

/**
 * Aprobar un comentario (Solo Admin)
 * @param {Number} id - ID del comentario
 * @returns {Promise<Object>} Comentario aprobado
 */
export const aprobarComentario = async (id) => {
  const response = await api.put(`/comentarios/${id}/aprobar`);
  return response.data;
};

/**
 * Rechazar un comentario (Solo Admin)
 * @param {Number} id - ID del comentario
 * @returns {Promise<Object>} Comentario rechazado
 */
export const rechazarComentario = async (id) => {
  const response = await api.put(`/comentarios/${id}/rechazar`);
  return response.data;
};
