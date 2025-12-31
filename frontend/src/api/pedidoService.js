import api from "./axiosConfig";

/**
 * Crea un nuevo pedido en estado "Pendiente de Pago"
 * @param {Object} pedidoData - Datos del pedido
 * @param {Array} pedidoData.items - Items del carrito [{id, cantidad}, ...]
 * @param {Number} pedidoData.cupon_id - ID del cupón (opcional)
 * @param {Object} pedidoData.datos_entrega - Datos de entrega {telefono, direccion, notas}
 * @returns {Promise<Object>} Datos del pedido creado con información de pago SINPE
 */
export const crearPedido = async (pedidoData) => {
  const response = await api.post("/pedidos", pedidoData);
  return response.data;
};

/**
 * Confirma el pago de un pedido subiendo el comprobante
 * @param {Number} pedidoId - ID del pedido
 * @param {String} comprobanteUrl - URL del comprobante en Supabase Storage
 * @returns {Promise<Object>} Confirmación del pago
 */
export const confirmarPago = async (pedidoId, comprobanteUrl) => {
  const response = await api.post(`/pedidos/${pedidoId}/confirmar-pago`, {
    comprobante_url: comprobanteUrl,
  });
  return response.data;
};

/**
 * Obtiene el historial de pedidos del usuario autenticado
 * @returns {Promise<Array>} Lista de pedidos
 */
export const getMisPedidos = async () => {
  const response = await api.get("/pedidos/mis-pedidos");
  return response.data;
};

/**
 * Obtiene el detalle completo de un pedido específico
 * @param {Number} id - ID del pedido
 * @returns {Promise<Object>} Detalle del pedido
 */
export const getPedido = async (id) => {
  const response = await api.get(`/pedidos/${id}`);
  return response.data;
};

/**
 * Cancela un pedido (solo si está en "Pendiente de Pago")
 * @param {Number} id - ID del pedido
 * @returns {Promise<Object>} Confirmación de cancelación
 */
export const cancelarPedido = async (id) => {
  const response = await api.delete(`/pedidos/${id}/cancelar`);
  return response.data;
};

/**
 * Lista todos los pedidos del sistema (Solo Admin)
 * @returns {Promise<Array>} Lista completa de pedidos
 */
export const getTodosPedidos = async () => {
  const response = await api.get("/pedidos/admin/todos");
  return response.data;
};

/**
 * Actualiza el estado de un pedido (Solo Admin)
 * @param {Number} id - ID del pedido
 * @param {Number} estadoId - Nuevo estado del pedido
 * @returns {Promise<Object>} Confirmación de actualización
 */
export const actualizarEstadoPedido = async (id, estadoId) => {
  const response = await api.put(`/pedidos/${id}/estado`, {
    estado_id: estadoId,
  });
  return response.data;
};

/**
 * Actualiza datos del pedido completo (Solo Admin)
 * @param {Number} id - ID del pedido
 * @param {Object} data - Datos a actualizar { total, cupon_id, notas }
 * @returns {Promise<Object>} Pedido actualizado
 */
export const actualizarPedido = async (id, data) => {
  const response = await api.put(`/pedidos/${id}`, data);
  return response.data;
};

/**
 * Elimina un pedido (Solo Admin)
 * Solo permite eliminar pedidos en estado Pendiente de Pago o Cancelado
 * @param {Number} id - ID del pedido
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarPedido = async (id) => {
  const response = await api.delete(`/pedidos/${id}`);
  return response.data;
};
