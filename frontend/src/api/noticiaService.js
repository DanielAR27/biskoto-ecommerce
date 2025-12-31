import api from "./axiosConfig";

/**
 * Obtener todas las noticias
 * @returns {Promise<Array>} Lista de noticias
 */
export const getNoticias = async () => {
  const response = await api.get("/noticias");
  return response.data;
};

/**
 * Obtener una noticia por ID o slug
 * @param {Number|String} id - ID o slug de la noticia
 * @returns {Promise<Object>} Noticia completa
 */
export const getNoticia = async (id) => {
  const response = await api.get(`/noticias/${id}`);
  return response.data;
};

/**
 * Crear una nueva noticia (Solo Admin)
 * @param {Object} noticiaData - Datos de la noticia
 * @returns {Promise<Object>} Noticia creada
 */
export const crearNoticia = async (noticiaData) => {
  const response = await api.post("/noticias", noticiaData);
  return response.data;
};

/**
 * Actualizar una noticia (Solo Admin)
 * @param {Number} id - ID de la noticia
 * @param {Object} noticiaData - Datos a actualizar
 * @returns {Promise<Object>} Noticia actualizada
 */
export const actualizarNoticia = async (id, noticiaData) => {
  const response = await api.put(`/noticias/${id}`, noticiaData);
  return response.data;
};

/**
 * Eliminar una noticia (Solo Admin)
 * @param {Number} id - ID de la noticia
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarNoticia = async (id) => {
  const response = await api.delete(`/noticias/${id}`);
  return response.data;
};
