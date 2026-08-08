const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const perfilRoutes = require("./routes/perfilRoutes");
const categoriasRoutes = require("./routes/categoriasRoutes");
const productosRoutes = require("./routes/productosRoutes");
const ingredientesRoutes = require("./routes/ingredientesRoutes");
const cuponesRoutes = require("./routes/cuponRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const proveedorRoutes = require("./routes/proveedorRoutes");
const comprasRoutes = require("./routes/comprasRoutes");
const pedidosRoutes = require("./routes/pedidosRoutes");
const unidadesRoutes = require("./routes/unidadRoutes");
const storageRoutes = require("./routes/storageRoutes");
const limpiezaRoutes = require("./routes/limpiezaRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors({
  origin: true, // Permite que el Access-Control-Allow-Origin coincida con el origen de la petición (ideal para Vercel, Render o Localhost)
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`🔵 ${req.method} ${req.url}`);
  next();
});


// Ruta rápida para mantener el servidor despierto (Cron Job)
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Rutas de API
app.use("/api/auth", authRoutes);
app.use("/api/perfiles", perfilRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/ingredientes", ingredientesRoutes);
app.use("/api/cupones", cuponesRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/limpieza", limpiezaRoutes);
app.use("/api/unidades", unidadesRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/noticias", require("./routes/noticiasRoutes"));
app.use("/api/comentarios", require("./routes/comentariosRoutes"));
app.use("/api/analytics", analyticsRoutes);

module.exports = app;
