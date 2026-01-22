import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Calendar,
  Loader2,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import {
  obtenerResumen,
  obtenerVentas,
  obtenerVentasMensuales,
} from "../../../api/analyticsService";

/**
 * Página de Dashboard de Analíticas para Administradores
 */
const DashboardPage = () => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Datos de analíticas
  const [resumen, setResumen] = useState(null);
  const [datosVentas, setDatosVentas] = useState(null);
  const [ventasMensuales, setVentasMensuales] = useState(null);

  // Colores para las gráficas
  const COLORES_ESTADOS = [
    "#3b82f6", // Azul - Pendiente de Pago
    "#10b981", // Verde - Pago Confirmado
    "#8b5cf6", // Púrpura - Completado
    "#f59e0b", // Amarillo - En Preparación
    "#ef4444", // Rojo - Cancelado
    "#6b7280", // Gris - Otros
  ];

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar en paralelo
        const [resumenData, ventasData, mensualesData] = await Promise.all([
          obtenerResumen(),
          obtenerVentas({ periodo: periodoSeleccionado }),
          obtenerVentasMensuales(),
        ]);

        setResumen(resumenData);
        setDatosVentas(ventasData);
        setVentasMensuales(mensualesData);
      } catch (error) {
        console.error("Error al cargar analíticas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  /**
   * Actualizar datos de ventas cuando cambia el período
   */
  useEffect(() => {
    const actualizarVentas = async () => {
      try {
        const params = { periodo: periodoSeleccionado };

        if (
          periodoSeleccionado === "personalizado" &&
          fechaInicio &&
          fechaFin
        ) {
          params.fecha_inicio = fechaInicio;
          params.fecha_fin = fechaFin;
        }

        const ventasData = await obtenerVentas(params);
        setDatosVentas(ventasData);
      } catch (error) {
        console.error("Error al actualizar ventas:", error);
      }
    };

    if (periodoSeleccionado !== "personalizado" || (fechaInicio && fechaFin)) {
      actualizarVentas();
    }
  }, [periodoSeleccionado, fechaInicio, fechaFin]);

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Formatear fecha para gráfica
  const formatFecha = (fecha) => {
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Formatear mes
  const formatMes = (mesAño) => {
    const [año, mes] = mesAño.split("-");
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${meses[parseInt(mes) - 1]} ${año.slice(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-biskoto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Dashboard de Analíticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualiza el rendimiento de tu negocio
          </p>
        </div>

        {/* KPIs - Cards de Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Ventas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Total Ventas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatMoneda(resumen?.totalVentas || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Pedidos del Mes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Pedidos del Mes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {resumen?.pedidosMesActual || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total de Clientes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Total Clientes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {resumen?.totalClientes || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Promedio por Pedido */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Promedio por Pedido
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatMoneda(datosVentas?.promedioVenta || 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de Período */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
              >
                <option value="semana">Última Semana</option>
                <option value="mes">Último Mes</option>
                <option value="año">Último Año</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {periodoSeleccionado === "personalizado" && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfica de Ventas Diarias */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-biskoto" />
              Ventas por Día
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosVentas?.datosGrafica || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatFecha}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => formatMoneda(value)}
                />
                <Bar dataKey="total" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de Pedidos por Estado */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-biskoto" />
              Pedidos por Estado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resumen?.estadosCantidad || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.nombre}: ${entry.cantidad}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {(resumen?.estadosCantidad || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORES_ESTADOS[index % COLORES_ESTADOS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Tendencia Mensual */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800 mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-biskoto" />
            Tendencia de Ventas (Últimos 12 Meses)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={ventasMensuales?.datosGrafica || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.1}
              />
              <XAxis dataKey="mes" tickFormatter={formatMes} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value, name) => {
                  if (name === "total") return [formatMoneda(value), "Ventas"];
                  return [value, "Pedidos"];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#7c3aed"
                strokeWidth={3}
                name="Ventas"
                dot={{ fill: "#7c3aed", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cantidad"
                stroke="#10b981"
                strokeWidth={2}
                name="Cantidad de Pedidos"
                dot={{ fill: "#10b981", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Top 5 Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {(resumen?.topProductos || []).map((producto, index) => (
              <div
                key={producto.producto_id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-biskoto text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {producto.nombre}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">
                  {producto.total_vendido} unidades
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
