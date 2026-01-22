# Manual Técnico - Sistema Web Biskoto

> **Proyecto de Ingeniería de Software (IC-7841)**  
> Sistema de comercio electrónico para repostería artesanal  
> Tecnológico de Costa Rica - Verano 2025-2026

---

## Tabla de Contenidos

1. [Visión General](#1-vision-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnologico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Instalación y Configuración](#6-instalacion-y-configuracion)
7. [Endpoints de la API](#7-endpoints-de-la-api)
8. [Módulos del Sistema](#8-módulos-del-sistema)
9. [Seguridad](#9-seguridad)
10. [Testing](#10-testing)
11. [Despliegue](#11-despliegue)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visión General

El Sistema Web Biskoto es una solución integral de comercio electrónico diseñada específicamente para la gestión y venta de productos de repostería artesanal. El sistema permite:

- **Gestión de inventario** con control de ingredientes y productos terminados
- **Catálogo público** interactivo con validación de stock en tiempo real
- **Sistema de pedidos** con estados y seguimiento completo
- **Panel administrativo** para gestión de productos, ingredientes, proveedores y pedidos
- **Sistema de cupones** con descuentos porcentuales y fijos
- **Portal de noticias** con sistema de comentarios moderados
- **Dashboard de analíticas** con métricas de ventas y gráficas interactivas

### Objetivos del Proyecto

- Administrar el inventario de ingredientes y productos terminados
- Procesar compras a proveedores y ventas a clientes
- Ofrecer un catálogo público con validación de disponibilidad basada en ingredientes
- Garantizar la integridad de datos mediante validaciones de stock en tiempo real
- Proporcionar métricas de negocio mediante dashboard de analíticas

---

## 2. Arquitectura del Sistema

### 2.1 Estilo Arquitectónico

El sistema adopta una **arquitectura Cliente-Servidor desacoplada** basada en servicios separados:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente Final / Admin                     │
│                      (Navegador Web)                         │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/JSON
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Frontend    │  │     Backend      │  │  Supabase    │
│  (Static)     │  │   (Web Service)  │  │  (Database)  │
│               │  │                  │  │              │
│ React + Vite  │  │  Node + Express  │  │  PostgreSQL  │
│               │  │                  │  │   + Auth     │
│               │  │                  │  │   + Storage  │
└───────────────┘  └──────────────────┘  └──────────────┘
     Render              Render             Supabase
```

### 2.2 Principios de Diseño

1. **Separación de Responsabilidades**
   - Frontend: Presentación e interacción del usuario
   - Backend: Lógica de negocio y validaciones
   - Base de Datos: Persistencia e integridad de datos

2. **Comunicación Asíncrona**
   - Protocolo HTTPS para todas las comunicaciones
   - Formato JSON para intercambio de datos
   - Cliente Axios para peticiones HTTP

3. **Seguridad en Profundidad**
   - Autenticación delegada (Supabase Auth)
   - JWT para sesiones stateless
   - RBAC (Control de Acceso Basado en Roles)
   - RLS (Row Level Security) en PostgreSQL

### 2.3 Vista de Despliegue

El sistema se despliega completamente en la nube usando servicios PaaS:

| Componente        | Servicio            | Función                    |
| ----------------- | ------------------- | -------------------------- |
| **Frontend**      | Render Static Site  | Servir SPA de React        |
| **Backend**       | Render Web Service  | Ejecutar API de Node.js    |
| **Base de Datos** | Supabase PostgreSQL | Persistencia relacional    |
| **Autenticación** | Supabase Auth       | Gestión de identidad y JWT |
| **Storage**       | Supabase Storage    | Almacenamiento de imágenes |

---

## 3. Stack Tecnológico

### Backend

- **Runtime:** Node.js v16+
- **Framework:** Express.js
- **Cliente DB:** Supabase Client SDK
- **Autenticación:** JSON Web Tokens (JWT)
- **Variables de Entorno:** dotenv

### Frontend

- **Framework:** React 18
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS
- **Enrutamiento:** React Router v6
- **HTTP Client:** Axios
- **Gestión de Estado:** React Context API
- **Gráficas:** Recharts (para dashboard de analíticas)
- **Iconos:** Lucide React

### Base de Datos y Servicios

- **Base de Datos:** PostgreSQL (via Supabase)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **Triggers:** PL/pgSQL

### Herramientas de Desarrollo

- **Control de Versiones:** Git
- **Despliegue:** Render (Frontend y Backend)
- **Documentación:** Markdown

---

## 4. Estructura del Proyecto

```
Proyecto-IC7841/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js              # Configuración del cliente Supabase
│   │   ├── controllers/
│   │   │   ├── analyticsController.js   # Lógica de métricas y estadísticas
│   │   │   ├── authController.js        # Autenticación y registro
│   │   │   ├── categoriaController.js   # Gestión de categorías
│   │   │   ├── comentarioController.js  # Moderación de comentarios
│   │   │   ├── comprasController.js     # Compras a proveedores
│   │   │   ├── cuponController.js       # Cupones de descuento
│   │   │   ├── ingredienteController.js # Gestión de inventario
│   │   │   ├── noticiaController.js     # Publicación de noticias
│   │   │   ├── pedidosController.js     # Procesamiento de pedidos
│   │   │   ├── productoController.js    # Gestión de productos
│   │   │   ├── proveedorController.js   # Gestión de proveedores
│   │   │   └── usuarioController.js     # Administración de usuarios
│   │   ├── middleware/
│   │   │   └── authMiddleware.js        # Verificación JWT y RBAC
│   │   ├── routes/
│   │   │   ├── analyticsRoutes.js       # Endpoints de analíticas
│   │   │   ├── authRoutes.js
│   │   │   ├── categoriasRoutes.js
│   │   │   ├── comentariosRoutes.js
│   │   │   ├── comprasRoutes.js
│   │   │   ├── cuponesRoutes.js
│   │   │   ├── ingredientesRoutes.js
│   │   │   ├── noticiasRoutes.js
│   │   │   ├── pedidosRoutes.js
│   │   │   ├── productosRoutes.js
│   │   │   ├── proveedoresRoutes.js
│   │   │   └── usuariosRoutes.js
│   │   └── app.js                       # Configuración Express
│   ├── index.js                         # Punto de entrada
│   ├── package.json
│   └── .env                             # Variables de entorno
│
├── database/
│   ├── schema.sql                       # Definición de tablas
│   ├── seed.sql                         # Datos iniciales
│   ├── auth_trigger.sql                 # Trigger de sincronización de perfiles
│   ├── actualizar_stock_por_compra.sql  # Trigger de actualización de inventario
│   └── ERD_-_Biskoto.svg               # Diagrama Entidad-Relación
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                         # Servicios de comunicación con Backend
│   │   │   ├── analyticsService.js      # Servicio de analíticas
│   │   │   ├── axiosConfig.js           # Configuración de Axios
│   │   │   ├── authService.js
│   │   │   ├── categoriaService.js
│   │   │   ├── comentarioService.js
│   │   │   ├── compraService.js
│   │   │   ├── cuponService.js
│   │   │   ├── ingredienteService.js
│   │   │   ├── noticiaService.js
│   │   │   ├── pedidoService.js
│   │   │   ├── productoService.js
│   │   │   ├── proveedorService.js
│   │   │   └── usuarioService.js
│   │   ├── assets/                      # Recursos estáticos
│   │   ├── components/                  # Componentes reutilizables
│   │   │   ├── admin/
│   │   │   │   ├── AdminMenu.jsx        # Menú de administración
│   │   │   │   └── ...
│   │   │   ├── ui/
│   │   │   ├── CartDrawer.jsx
│   │   │   └── Navbar.jsx
│   │   ├── context/                     # Gestión de estado global
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/                       # Vistas principales
│   │   │   ├── admin/
│   │   │   │   ├── categorias/
│   │   │   │   ├── comentarios/
│   │   │   │   ├── compras/
│   │   │   │   ├── cupones/
│   │   │   │   ├── dashboard/           # Dashboard de analíticas
│   │   │   │   │   └── DashboardPage.jsx
│   │   │   │   ├── ingredientes/
│   │   │   │   ├── noticias/
│   │   │   │   ├── pedidos/
│   │   │   │   ├── productos/
│   │   │   │   ├── proveedores/
│   │   │   │   └── usuarios/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── home/
│   │   │   │   └── HomePage.jsx
│   │   │   ├── noticias/
│   │   │   ├── shop/
│   │   │   │   ├── CheckoutPage.jsx
│   │   │   │   └── ProductDetailPage.jsx
│   │   │   └── user/
│   │   ├── App.jsx                      # Enrutamiento principal
│   │   └── main.jsx                     # Punto de entrada React
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── SAD_-_Proyecto_Biskoto.pdf          # Documento de Arquitectura
```

---

## 5. Modelo de Datos

### 5.1 Diagrama Entidad-Relación

Ver archivo adjunto: `database/ERD_-_Biskoto.svg`

### 5.2 Entidades Principales

#### Tabla: `perfiles`

Almacena información de usuarios (clientes y administradores).

| Campo       | Tipo       | Descripción                        |
| ----------- | ---------- | ---------------------------------- |
| `id`        | UUID       | PK - Relacionado con Supabase Auth |
| `perfil_id` | UUID       | FK - Referencia a `auth.users`     |
| `nombre`    | VARCHAR    | Nombre del usuario                 |
| `apellido`  | VARCHAR    | Apellido del usuario               |
| `telefono`  | VARCHAR(8) | Teléfono de contacto               |
| `direccion` | TEXT       | Dirección física                   |
| `rol`       | ENUM       | 'admin' o 'cliente'                |

#### Tabla: `productos`

Catálogo de productos terminados para la venta.

| Campo                 | Tipo    | Descripción                 |
| --------------------- | ------- | --------------------------- |
| `id`                  | SERIAL  | PK                          |
| `nombre`              | VARCHAR | Nombre del producto         |
| `descripcion`         | TEXT    | Descripción detallada       |
| `precio`              | NUMERIC | Precio de venta unitario    |
| `stock_actual`        | INTEGER | Cantidad en inventario      |
| `categoria_id`        | INTEGER | FK - Categoría del producto |
| `activo`              | BOOLEAN | Visibilidad en catálogo     |
| `requiere_adelanto`   | BOOLEAN | Si requiere pago anticipado |
| `porcentaje_adelanto` | INTEGER | % de adelanto requerido     |

#### Tabla: `ingredientes`

Inventario de materias primas e insumos.

| Campo          | Tipo    | Descripción                     |
| -------------- | ------- | ------------------------------- |
| `id`           | SERIAL  | PK                              |
| `nombre`       | VARCHAR | Nombre del ingrediente          |
| `stock_actual` | NUMERIC | Cantidad disponible             |
| `unidad_id`    | INTEGER | FK - Unidad de medida           |
| `es_ilimitado` | BOOLEAN | Si no requiere control de stock |

#### Tabla: `producto_ingredientes`

Relación muchos-a-muchos entre productos e ingredientes (recetas).

| Campo                | Tipo    | Descripción                   |
| -------------------- | ------- | ----------------------------- |
| `producto_id`        | INTEGER | FK - Producto                 |
| `ingrediente_id`     | INTEGER | FK - Ingrediente              |
| `cantidad_necesaria` | NUMERIC | Cantidad requerida por unidad |

#### Tabla: `pedidos`

Órdenes de venta de clientes.

| Campo                 | Tipo      | Descripción                        |
| --------------------- | --------- | ---------------------------------- |
| `id`                  | SERIAL    | PK                                 |
| `perfil_id`           | UUID      | FK - Cliente que realiza el pedido |
| `fecha`               | TIMESTAMP | Fecha de creación                  |
| `total`               | NUMERIC   | Monto total del pedido             |
| `estado_id`           | INTEGER   | FK - Estado actual del pedido      |
| `cupon_id`            | INTEGER   | FK - Cupón aplicado (nullable)     |
| `pago_completo`       | BOOLEAN   | Si el pago está completado         |
| `requiere_adelanto`   | BOOLEAN   | Si requiere adelanto               |
| `porcentaje_adelanto` | INTEGER   | % de adelanto                      |
| `monto_adelanto`      | NUMERIC   | Monto del adelanto                 |
| `monto_pendiente`     | NUMERIC   | Monto restante                     |

#### Tabla: `estados_pedido`

Catálogo de estados posibles de un pedido.

| ID  | Nombre            |
| --- | ----------------- |
| 1   | Pendiente de Pago |
| 2   | Confirmado        |
| 3   | En Producción     |
| 4   | Listo para Retiro |
| 5   | Entregado         |
| 6   | Cancelado         |
| 7   | Pago Parcial      |

#### Tabla: `cupones`

Sistema de descuentos promocionales.

| Campo             | Tipo    | Descripción             |
| ----------------- | ------- | ----------------------- |
| `id`              | SERIAL  | PK                      |
| `codigo`          | VARCHAR | Código único del cupón  |
| `tipo_descuento`  | ENUM    | 'porcentaje' o 'fijo'   |
| `valor_descuento` | NUMERIC | Valor del descuento     |
| `activo`          | BOOLEAN | Si el cupón está activo |

#### Tabla: `noticias`

Publicaciones informativas del sistema.

| Campo        | Tipo    | Descripción                 |
| ------------ | ------- | --------------------------- |
| `id`         | SERIAL  | PK                          |
| `titulo`     | VARCHAR | Título de la noticia        |
| `contenido`  | TEXT    | Contenido completo          |
| `imagen_url` | TEXT    | URL de imagen destacada     |
| `autor_id`   | UUID    | FK - Perfil del autor       |
| `activo`     | BOOLEAN | Visibilidad pública         |
| `vistas`     | INTEGER | Contador de visualizaciones |

#### Tabla: `comentarios`

Sistema de interacción en noticias.

| Campo        | Tipo      | Descripción                          |
| ------------ | --------- | ------------------------------------ |
| `id`         | SERIAL    | PK                                   |
| `noticia_id` | INTEGER   | FK - Noticia comentada               |
| `usuario_id` | UUID      | FK - Autor del comentario            |
| `contenido`  | TEXT      | Texto del comentario                 |
| `estado`     | VARCHAR   | 'Pendiente', 'Aprobado', 'Rechazado' |
| `fecha`      | TIMESTAMP | Fecha de creación                    |

### 5.3 Triggers Automáticos

#### `on_auth_user_created`

**Función:** Sincronización automática de perfiles al registrar un usuario.

```sql
-- Se ejecuta automáticamente al registrar un usuario en Supabase Auth
-- Crea un registro en la tabla 'perfiles' con los datos del nuevo usuario
```

#### `trg_gestion_stock_compra`

**Función:** Actualización automática de stock al registrar compras.

```sql
-- Al INSERT en compra_items: Incrementa stock_actual del ingrediente
-- Al DELETE en compra_items: Descuenta stock_actual del ingrediente
```

---

## 6. Instalación y Configuración

### 6.1 Prerrequisitos

- **Node.js** v16 o superior
- **npm** v7 o superior
- Cuenta en **Supabase**
- Cuenta en **Render** (opcional, para despliegue)
- **Git** instalado

### 6.2 Configuración del Backend

#### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Proyecto-IC7841/backend
```

#### Paso 2: Instalar Dependencias

```bash
npm install
```

#### Paso 3: Configurar Variables de Entorno

Crear archivo `.env` en `backend/`:

```env
# Puerto del servidor
PORT=3000

# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Variables Explicadas:**

- `PORT`: Puerto donde se ejecutará el servidor Express
- `SUPABASE_URL`: URL de tu proyecto en Supabase
- `SUPABASE_KEY`: Clave pública (anon key) de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio para operaciones administrativas

#### Paso 4: Configurar Base de Datos

1. Ejecutar `database/schema.sql` en el SQL Editor de Supabase
2. Ejecutar `database/auth_trigger.sql`
3. Ejecutar `database/actualizar_stock_por_compra.sql`
4. (Opcional) Ejecutar `database/seed.sql` para datos de prueba

#### Paso 5: Iniciar Servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

### 6.3 Configuración del Frontend

#### Paso 1: Navegar al Directorio

```bash
cd frontend
```

#### Paso 2: Instalar Dependencias

```bash
npm install
```

#### Paso 3: Configurar Variables de Entorno

Crear archivo `.env` en `frontend/`:

```env
# URL de la API del Backend
VITE_API_URL=http://localhost:3000/api

# Configuración de Supabase (para autenticación y storage)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

#### Paso 4: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

#### Paso 5: Build para Producción

```bash
npm run build
```

Los archivos generados estarán en `frontend/dist/`

---

## 7. Endpoints de la API

### 7.1 Autenticación

#### `POST /api/auth/login`

Iniciar sesión de usuario.

**Request:**

```json
{
  "correo": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "correo": "usuario@ejemplo.com",
    "rol": "cliente"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### `POST /api/auth/register`

Registrar nuevo usuario.

**Request:**

```json
{
  "correo": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "88887777",
  "direccion": "San José, Costa Rica"
}
```

### 7.2 Productos

#### `GET /api/productos`

Obtener catálogo de productos con paginación.

**Query Params:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 20)
- `categoria` (opcional): Filtrar por categoría

**Response (200 OK):**

```json
{
  "productos": [...],
  "totalProductos": 50,
  "paginaActual": 1,
  "totalPaginas": 3
}
```

#### `POST /api/productos/validar-disponibilidad`

Validar disponibilidad de productos basado en stock e ingredientes.

**Request:**

```json
{
  "items": [
    { "id": 1, "cantidad": 2 },
    { "id": 2, "cantidad": 1 }
  ]
}
```

**Response (200 OK):**

```json
{
  "disponible": true,
  "items": [...]
}
```

**Response (400 Bad Request) - Stock Insuficiente:**

```json
{
  "error": "Stock insuficiente para algunos productos",
  "conflictos": [
    {
      "id": 1,
      "nombre": "Pie de Limón",
      "cantidadSolicitada": 2,
      "cantidadDisponible": 1
    }
  ]
}
```

### 7.3 Pedidos

#### `POST /api/pedidos`

Crear nuevo pedido (requiere autenticación).

**Request:**

```json
{
  "items": [
    { "id": 1, "cantidad": 2 },
    { "id": 2, "cantidad": 1 }
  ],
  "cupon_id": 5,
  "datos_entrega": {
    "metodo_entrega": "recoger",
    "telefono_contacto": "88887777",
    "direccion_entrega": null,
    "notas": "Recoger en local"
  }
}
```

**Response (201 Created):**

```json
{
  "pedido": {
    "id": 123,
    "numero_referencia": "BK-2025-123",
    "total": 15000,
    "estado_id": 1,
    "requiere_adelanto": true,
    "monto_adelanto": 7500
  }
}
```

#### `GET /api/pedidos/usuario/:perfil_id`

Obtener historial de pedidos de un usuario (requiere autenticación).

### 7.4 Cupones

#### `POST /api/cupones/validar`

Validar un cupón de descuento.

**Request:**

```json
{
  "codigo": "DESCUENTO10"
}
```

**Response (200 OK):**

```json
{
  "valido": true,
  "cupon": {
    "id": 5,
    "codigo": "DESCUENTO10",
    "tipo_descuento": "porcentaje",
    "valor_descuento": 10,
    "activo": true
  }
}
```

### 7.5 Analíticas (Solo Admin)

#### `GET /api/analytics/resumen`

Obtener resumen general de métricas.

**Response (200 OK):**

```json
{
  "totalVentas": 93598.81,
  "estadosCantidad": [
    { "estado_id": 1, "nombre": "Pendiente de Pago", "cantidad": 8 },
    { "estado_id": 2, "nombre": "Confirmado", "cantidad": 5 }
  ],
  "topProductos": [
    { "producto_id": 1, "nombre": "Pie de Limón", "total_vendido": 45 }
  ],
  "totalClientes": 9,
  "pedidosMesActual": 22
}
```

#### `GET /api/analytics/ventas`

Obtener ventas por período.

**Query Params:**

- `periodo`: "semana", "mes", "año", "personalizado"
- `fecha_inicio`: ISO date (si periodo = "personalizado")
- `fecha_fin`: ISO date (si periodo = "personalizado")

**Response (200 OK):**

```json
{
  "periodo": "mes",
  "fecha_inicio": "2025-01-01",
  "fecha_fin": "2025-01-31",
  "totalVentas": 85000,
  "totalPedidos": 15,
  "promedioVenta": 5666.67,
  "datosGrafica": [{ "fecha": "2025-01-15", "total": 12000, "cantidad": 3 }]
}
```

#### `GET /api/analytics/ventas-mensuales`

Obtener ventas de los últimos 12 meses.

### 7.6 Noticias

#### `GET /api/noticias`

Obtener listado de noticias activas (público) o todas (admin).

#### `POST /api/noticias`

Publicar nueva noticia (requiere rol admin).

### 7.7 Comentarios

#### `POST /api/comentarios`

Publicar comentario en una noticia (requiere autenticación).

#### `PUT /api/comentarios/:id/aprobar`

Aprobar comentario (requiere rol admin).

#### `PUT /api/comentarios/:id/rechazar`

Rechazar comentario (requiere rol admin).

---

## 8. Módulos del Sistema

### 8.1 Gestión de Productos (Admin)

- **CRUD completo** de productos
- **Carga de imágenes** a Supabase Storage
- **Gestión de recetas** (producto-ingredientes)
- **Control de visibilidad** (activo/inactivo)
- **Sistema de adelanto** configurable

### 8.2 Gestión de Inventario (Admin)

- **CRUD de ingredientes**
- **Unidades de medida** configurables
- **Control de stock** con decimales
- **Ingredientes ilimitados** (sin control de stock)

### 8.3 Gestión de Compras (Admin)

- **Registro de compras** a proveedores
- **Actualización automática** de stock vía trigger
- **Gestión de proveedores**
- **Historial de transacciones**

### 8.4 Sistema de Pedidos

- **Catálogo público** con filtros por categoría
- **Carrito de compras** con persistencia en localStorage
- **Validación de stock** en tiempo real (algoritmo de "Reactivo Limitante")
- **Sistema de adelanto** para productos específicos
- **Aplicación de cupones** de descuento
- **Métodos de entrega**: Recoger en local o Envío Express
- **Estados de pedido**: Pendiente, Confirmado, En Producción, Listo, Entregado, Cancelado

### 8.5 Sistema de Cupones (Admin)

- **CRUD de cupones**
- **Tipos de descuento**: Porcentaje o monto fijo
- **Validación** de vigencia y estado
- **Aplicación automática** en checkout

### 8.6 Portal de Noticias

- **Publicación de noticias** (admin)
- **Visualización pública** de noticias activas
- **Sistema de comentarios** de usuarios registrados
- **Moderación de comentarios** (Pendiente/Aprobado/Rechazado)
- **Contador de vistas**

### 8.7 Dashboard de Analíticas (Admin)

- **KPIs principales**:
  - Total de ventas
  - Pedidos del mes
  - Total de clientes
  - Promedio por pedido
- **Gráficas interactivas**:
  - Ventas por día (barras)
  - Pedidos por estado (pastel)
  - Tendencia de ventas (líneas - últimos 12 meses)
- **Filtros**:
  - Por período: semana, mes, año, personalizado
  - Por rango de fechas
- **Top 5 productos** más vendidos

### 8.8 Gestión de Usuarios (Admin)

- **Listado de usuarios** con roles
- **Edición de perfiles**
- **Control de acceso** basado en roles

### 8.9 Autenticación y Seguridad

- **Registro de usuarios** con validación
- **Inicio de sesión** con JWT
- **Recuperación de contraseña**
- **RBAC** (Control de Acceso Basado en Roles)
- **RLS** (Row Level Security) en base de datos

---

## 9. Seguridad

### 9.1 Autenticación

El sistema utiliza **Supabase Auth** para la gestión de identidad:

- **Delegación de credenciales**: Las contraseñas nunca se almacenan en el backend
- **Hashing seguro**: Supabase usa bcrypt para contraseñas
- **Tokens JWT**: Sesiones stateless con tokens firmados
- **Refresh tokens**: Para renovación automática de sesión

### 9.2 Control de Acceso

#### RBAC (Control de Acceso Basado en Roles)

**Roles del sistema:**

- `admin`: Acceso completo a panel administrativo
- `cliente`: Acceso solo a funciones de cliente (catálogo, pedidos propios)

**Middleware de Autorización:**

```javascript
// verifyToken: Valida JWT en cada petición
// isAdmin: Verifica rol de administrador
app.use("/api/admin/*", verifyToken, isAdmin);
```

#### RLS (Row Level Security)

Políticas de seguridad a nivel de base de datos:

```sql
-- Ejemplo: Usuarios solo ven sus propios pedidos
CREATE POLICY "Usuarios ven solo sus pedidos"
ON pedidos FOR SELECT
USING (auth.uid() = perfil_id);

-- Ejemplo: Solo admins pueden moderar comentarios
CREATE POLICY "Solo admin modera comentarios"
ON comentarios FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM perfiles WHERE rol = 'admin'
  )
);
```

### 9.3 Protección de Datos

- **HTTPS obligatorio**: Toda comunicación cifrada en tránsito
- **Validación de entrada**: Sanitización de datos en controladores
- **Protección XSS**: React sanitiza automáticamente
- **Protección CSRF**: Tokens JWT previenen ataques CSRF
- **CORS configurado**: Solo dominios autorizados

### 9.4 Storage Seguro

- **URLs firmadas**: Para carga de imágenes
- **Políticas de bucket**:
  - Lectura pública para catálogo
  - Escritura solo para administradores autenticados

---

## 10. Testing

### 10.1 Estrategia de Pruebas

```
           Pruebas de Aceptación
                    ▲
                    │
        Pruebas de Integración
                    ▲
                    │
          Pruebas Unitarias
```

### 10.2 Pruebas Unitarias

**Funciones críticas a probar:**

- Cálculo de stock disponible (algoritmo de reactivo limitante)
- Validación de cupones
- Cálculo de adelanto
- Formateo de números de referencia

**Herramientas sugeridas:**

- Jest para Node.js
- React Testing Library para componentes

### 10.3 Pruebas de Integración

**Escenarios a validar:**

- Flujo completo de checkout
- Actualización de stock tras compra
- Sincronización de perfiles tras registro
- Aplicación de descuentos

### 10.4 Pruebas de Aceptación

**Casos de uso críticos:**

1. Usuario puede realizar pedido completo
2. Admin puede gestionar inventario
3. Sistema previene sobreventa
4. Cupones se aplican correctamente
5. Dashboard muestra métricas correctas
6. Comentarios se moderan correctamente

---

## 11. Despliegue

### 11.1 Despliegue en Render

#### Backend (Web Service)

1. **Crear Web Service** en Render
2. **Conectar repositorio** de Git
3. **Configurar Build Command:**
   ```bash
   npm install
   ```
4. **Configurar Start Command:**
   ```bash
   npm start
   ```
5. **Agregar Variables de Entorno:**
   - `PORT=3000`
   - `SUPABASE_URL=...`
   - `SUPABASE_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`

#### Frontend (Static Site)

1. **Crear Static Site** en Render
2. **Conectar repositorio** de Git
3. **Configurar Build Command:**
   ```bash
   cd frontend && npm install && npm run build
   ```
4. **Configurar Publish Directory:**
   ```
   frontend/dist
   ```
5. **Agregar Variables de Entorno:**
   - `VITE_API_URL=https://tu-backend.onrender.com/api`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`

### 11.2 Configuración de CORS

En `backend/src/app.js`:

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: "https://tu-frontend.onrender.com",
    credentials: true,
  }),
);
```

### 11.3 Base de Datos en Supabase

1. Crear proyecto en Supabase
2. Ejecutar scripts SQL en orden:
   - `schema.sql`
   - `auth_trigger.sql`
   - `actualizar_stock_por_compra.sql`
   - `seed.sql` (opcional)
3. Configurar Storage Bucket para imágenes
4. Configurar RLS policies
5. Habilitar Email Auth

---

## 12. Troubleshooting

### 12.1 Problemas Comunes

#### Error: "Stock insuficiente" pero producto muestra disponibilidad

**Causa:** Falta de ingredientes necesarios para fabricar el producto.

**Solución:**

```sql
-- Verificar ingredientes del producto
SELECT
  p.nombre AS producto,
  i.nombre AS ingrediente,
  i.stock_actual,
  pi.cantidad_necesaria,
  FLOOR(i.stock_actual / pi.cantidad_necesaria) AS max_fabricable
FROM productos p
JOIN producto_ingredientes pi ON p.id = pi.producto_id
JOIN ingredientes i ON pi.ingrediente_id = i.id
WHERE p.id = <ID_PRODUCTO>;
```

#### Error: "Producto no encontrado" en checkout

**Causa:** Producto eliminado pero aún en localStorage del cliente.

**Solución:**

```javascript
// En consola del navegador
localStorage.removeItem("cart");
location.reload();
```

#### Error: Column "created_at" does not exist

**Causa:** La columna se llama "fecha" en la base de datos.

**Solución:** Verificar que el backend use "fecha" en lugar de "created_at".

#### Dashboard muestra datos en cero

**Causa:** Estados de pedidos incorrectos en queries.

**Solución:** Verificar que los IDs de estados coincidan con la DB:

```sql
SELECT * FROM estados_pedido ORDER BY id;
```

### 12.2 Verificación de Salud del Sistema

#### Backend Health Check

```bash
curl http://localhost:3000/api/health
```

#### Verificar Conexión a Supabase

```javascript
// En consola del navegador
fetch("http://localhost:3000/api/productos")
  .then((r) => r.json())
  .then((data) => console.log("Productos:", data));
```

#### Verificar Autenticación

```javascript
// En consola del navegador
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));
```

---

## Referencias

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)

---

## Equipo de Desarrollo

- **Daniel Alemán Ruiz** - 2023051957
- **Luis Meza Chavarría** - 2023800023

**Profesora:** Ing. Alicia Salazar Hernández, MSc  
**Curso:** IC-7841 - Proyecto de Ingeniería de Software  
**Período:** Verano 2025-2026  
**Institución:** Tecnológico de Costa Rica

---

## Licencia

Este proyecto es desarrollado con fines académicos para el curso IC-7841.

---

_Última actualización: Enero 2026_
