import api from "./axiosConfig";

/**
 * Servicio de Compras (Abastecimiento de ingredientes).
 */

/**
 * Obtiene el historial de todas las compras.
 */
export const getCompras = async () => {
  const response = await api.get("/compras");
  return response.data;
};

/**
 * Obtiene el detalle de una compra específica por ID.
 * Incluye items y sus ingredientes asociados.
 */
export const getCompraById = async (id) => {
  const response = await api.get(`/compras/${id}`);
  return response.data;
};

/**
 * Crea una nueva compra con sus items.
 * El stock se incrementa automáticamente vía trigger.
 */
export const createCompra = async (compraData) => {
  const response = await api.post("/compras", compraData);
  return response.data;
};

/**
 * Actualiza una compra existente.
 * Los items antiguos se eliminan y los nuevos se insertan.
 * El trigger ajusta el stock automáticamente.
 */
export const updateCompra = async (id, compraData) => {
  const response = await api.put(`/compras/${id}`, compraData);
  return response.data;
};

/**
 * Elimina una compra y revierte el stock vía trigger.
 */
export const deleteCompra = async (id) => {
  const response = await api.delete(`/compras/${id}`);
  return response.data;
};
