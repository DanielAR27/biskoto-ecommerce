<div align="center">

  <img src="frontend/src/assets/logo_biskoto_transparente_dm.png" alt="Biskoto Logo" width="300" />

  **Plataforma de comercio electrónico para repostería artesanal**

  Se gestionan productos, pedidos, inventario y clientes mediante una experiencia moderna y fluida.

  <br />

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

  <br />

  [EN](README.md) | **ES**

  <br />

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-biskoto--ecommerce.vercel.app-3ECF8E?style=flat-square&logo=vercel&logoColor=white)](https://biskoto-ecommerce.vercel.app)

</div>

<br />

## 📖 Tabla de Contenidos

- [1. ¿Qué es Biskoto?](#-qué-es-biskoto)
- [2. Funcionalidades](#-funcionalidades)
- [3. Sistema de Autenticación](#-sistema-de-autenticación)
- [4. Arquitectura](#️-arquitectura)
- [5. Stack Tecnológico](#-stack-tecnológico)
- [6. Documentación](#-documentación)
- [7. Inicio Rápido](#-inicio-rápido)
- [8. Capturas de pantalla](#-capturas-de-pantalla)
- [9. Demo en producción](#-demo-en-producción)
- [10. Licencia](#-licencia)

<br />

---

<br />

## 🍪 ¿Qué es Biskoto?

**Biskoto** consiste en una solución de e-commerce diseñada para negocios de repostería artesanal. El sistema le permite a los clientes explorar el catálogo, gestionar su carrito y realizar pedidos, mientras que a los administradores se les facilita el control del inventario, productos, ingredientes, proveedores y el flujo completo de ventas, todo operando desde una interfaz moderna con soporte de modo oscuro.

<br />

## ✨ Funcionalidades

<table>
<tr>
<td width="50%">

### Para Clientes
- Exploración del **catálogo de productos** con imágenes y precios.
- Gestión del **carrito** con validación de stock en tiempo real.
- **Perfil de usuario** que incluye un historial de pedidos.
- Sistema de **autenticación** seguro con recuperación de contraseña.
- Soporte integrado de **modo oscuro / claro**.

</td>
<td width="50%">

### Para Administradores
- **Panel de administración** con capacidades CRUD completas.
- Gestión de **productos**, **categorías** e **ingredientes**.
- Control del **inventario** y registro de **proveedores**.
- Administración de los **usuarios** y sus roles correspondientes.
- Procesamiento y seguimiento de las **compras** realizadas.

</td>
</tr>
</table>

<br />

## 🔐 Sistema de Autenticación

| Característica | Descripción |
|:---|:---|
| **Registro seguro** | Se gestiona mediante Supabase Auth |
| **Sesiones JWT** | Se utilizan tokens con refresco automático |
| **Roles** | Cliente · Administrador |
| **Rutas protegidas** | Se restringe el acceso según los permisos asignados |
| **Recuperación de contraseña** | Se incluye un flujo completo mediante correo electrónico |

<br />

---

<br />

## 🏗️ Arquitectura

```text
biskoto-ecommerce/
│
├── frontend/                         # Aplicación React + Vite
│   └── src/
│       ├── api/                      # Servicios de comunicación con el backend
│       ├── assets/                   # Imágenes, logo e íconos
│       ├── components/               # Componentes reutilizables de UI
│       ├── context/                  # Estado global
│       ├── pages/                    # Vistas (admin, auth, home, shop, user)
│       └── App.jsx                   # Enrutamiento principal
│
├── backend/                          # API REST con Express
│   └── src/
│       ├── config/                   # Configuración del cliente Supabase
│       ├── controllers/              # Lógica de negocio
│       ├── middleware/               # Autenticación y validación
│       └── routes/                   # Definición de endpoints
│
├── database/                         # Scripts SQL
│   ├── schema.sql
│   ├── seed.sql
│   └── auth_trigger.sql
│
└── docs/                             # Documentación y capturas
```

<br />

## 💻 Stack Tecnológico

<table>
<tr>
<td align="center" width="33%">
<br />

**Frontend**

<br />

| Tecnología | Uso |
|:---:|:---|
| React | Interfaz de usuario |
| Vite | Build & Dev Server |
| Tailwind CSS | Sistema de diseño |
| React Router | Navegación SPA |
| Context API | Estado global |

</td>
<td align="center" width="33%">
<br />

**Backend**

<br />

| Tecnología | Uso |
|:---:|:---|
| Node.js | Entorno de ejecución |
| Express | Framework HTTP |
| Supabase | Base de datos (PostgreSQL) |
| JWT | Autenticación |
| Axios | Cliente HTTP |

</td>
<td align="center" width="33%">
<br />

**Servicios**

<br />

| Tecnología | Uso |
|:---:|:---|
| Supabase Auth | Autenticación |
| Supabase Storage| Almacenamiento de imágenes |
| Vercel | Despliegue del frontend |
| Render | Despliegue del backend |

</td>
</tr>
</table>

<br />

---

<br />

## 📚 Documentación

En la carpeta `docs/` se encuentran disponibles los siguientes documentos de referencia:

- 📝 [**Manual Técnico**](docs/MANUAL_TECNICO.md)
- 📘 [**Manual de Usuario**](docs/Manual%20de%20Usuario%20-%20Biskoto.docx)
- 🧪 [**Plan de Pruebas**](docs/Plan%20de%20Pruebas%20-%20Proyecto%20de%20Biskoto.pdf)

<br />

---

<br />

## 🚀 Inicio Rápido

### Prerrequisitos

| Software | Versión mínima |
|:---|:---|
| [Node.js](https://nodejs.org/) | `v18+` |
| [Git](https://git-scm.com/) | Cualquier versión reciente |
| Cuenta en [Supabase](https://supabase.com/) | — |

<br />

<details>
<summary><strong>1. Clonar el repositorio</strong></summary>

<br />

```bash
git clone https://github.com/DanielAR27/biskoto-ecommerce.git
cd biskoto-ecommerce
```

</details>

<details>
<summary><strong>2. Configurar las variables de entorno</strong></summary>

<br />

**`backend/.env`**
```env
PORT=3000
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

</details>

<details>
<summary><strong>3. Levantar el backend</strong></summary>

<br />

```bash
cd backend
npm install
npm run dev
```

> El servidor se ejecutará en la dirección `http://localhost:3000`

</details>

<details>
<summary><strong>4. Levantar el frontend</strong></summary>

<br />

```bash
cd frontend
npm install
npm run dev
```

> La aplicación estará disponible en la dirección `http://localhost:5173`

</details>

<br />

---

<br />

## 📸 Capturas de pantalla

Las capturas se alojan en la carpeta [`docs/screenshots/`](docs/screenshots/).

<br />

<div align="center">

### 🏠 Inicio

En la página principal se presenta el catálogo de productos destacados, junto con la navegación y el carrito lateral.

<img src="docs/screenshots/biskoto_home.png" alt="Página de Inicio" width="700" />

<br />

---

### 🛍️ Catálogo de Productos

Se despliega la vista del catálogo que incluye tarjetas de producto, precios y control de disponibilidad de stock en tiempo real.

<img src="docs/screenshots/biskoto_catalog.png" alt="Catálogo" width="700" />

<br />

---

### 🛒 Carrito de Compras

El carrito lateral ofrece un resumen de productos, cantidades, validación de stock y el total de la compra.

<img src="docs/screenshots/biskoto_shopcart.png" alt="Carrito" width="700" />

<br />

---

### 🔑 Autenticación

Las páginas de inicio de sesión y registro cuentan con soporte de modo oscuro y recuperación de contraseña vía correo.

<img src="docs/screenshots/biskoto_login.png" alt="Autenticación" width="700" />

<br />

---

### 🛠️ Panel de Administración

Este panel completo permite la gestión CRUD de productos, ingredientes, proveedores, categorías y usuarios.

<img src="docs/screenshots/biskoto_products.png" alt="Panel Admin" width="700" />

</div>

<br />

---

<br />

## 🌐 Demo en producción

| | |
|:---|:---|
| **Frontend** | [biskoto-ecommerce.vercel.app](https://biskoto-ecommerce.vercel.app) |
| **Backend** | Render (Node.js + Express) |
| **Base de datos** | Supabase (PostgreSQL) |

<br />

---

<br />

## 📄 Licencia

El presente proyecto se encuentra distribuido bajo la licencia [MIT](LICENSE).

<br />

---

<br />

<div align="center">

  Elaborado por **Luis Meza** y **Daniel Alemán**

  <sub>© 2025 Biskoto · Proyecto académico</sub>

</div>
