const express = require("express");
const cors = require("cors");
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

const app = express();

app.use(cors());
app.use(express.json());

// 🔍 AGREGAR ESTAS LÍNEAS AQUÍ
app.use((req, res, next) => {
  console.log(`🔵 ${req.method} ${req.url}`);
  next();
});
// 🔍 FIN

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
app.use("/api/unidades", unidadesRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/noticias", require("./routes/noticiasRoutes"));
app.use("/api/comentarios", require("./routes/comentariosRoutes"));

module.exports = app;
