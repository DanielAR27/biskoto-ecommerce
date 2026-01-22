import api from "./axiosConfig";

/**
 * SERVICIO DE ANALÍTICAS
 * Consume endpoints de analytics del backend
 */

/**
 * Obtener resumen general de analíticas (filtrable por período)
 *
 * @param {Object} params
 * @param {string} params.periodo - "semana" | "mes" | "año" | "personalizado"
 * @param {string} params.fecha_inicio - ISO (solo si periodo = "personalizado")
 * @param {string} params.fecha_fin - ISO (solo si periodo = "personalizado")
 */
export const obtenerResumen = async (params = {}) => {
  const response = await api.get("/analytics/resumen", { params });
  return response.data;
};

/**
 * Obtener datos de ventas por período
 *
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.periodo - "semana" | "mes" | "año" | "personalizado"
 * @param {string} params.fecha_inicio - Fecha inicio (ISO) para período personalizado
 * @param {string} params.fecha_fin - Fecha fin (ISO) para período personalizado
 */
export const obtenerVentas = async (params = {}) => {
  const response = await api.get("/analytics/ventas", { params });
  return response.data;
};

/**
 * Obtener ventas mensuales (últimos 12 meses)
 */
export const obtenerVentasMensuales = async () => {
  const response = await api.get("/analytics/ventas-mensuales");
  return response.data;
};
