import api from "./axiosConfig";

export const getCategorias = async () => {
  const response = await api.get("/categorias");
  return response.data;
};

export const obtenerCategoria = async (id) => {
  const response = await api.get(`/categorias/${id}`);
  return response.data;
};

export const createCategoria = async (categoria) => {
  const response = await api.post("/categorias", categoria);
  return response.data;
};

export const updateCategoria = async (id, categoria) => {
  const response = await api.put(`/categorias/${id}`, categoria);
  return response.data;
};

export const deleteCategoria = async (id) => {
  const response = await api.delete(`/categorias/${id}`);
  return response.data;
};

export const getCategoriasActivas = async () => {
  const { data } = await api.get("/categorias/activas");
  return data;
};

/**
 * Alterna el estado activo/inactivo de una categoría
 */
export const toggleCategoria = async (id) => {
  const { data } = await api.patch(`/categorias/${id}/toggle`);
  return data;
};
