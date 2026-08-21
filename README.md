<div align="center">

  <img src="frontend/src/assets/logo_biskoto_transparente_dm.png" alt="Biskoto Logo" width="300" />

  **E-commerce platform for artisanal bakery**

  Manage products, orders, inventory, and customers in a modern and seamless experience.

  <br />

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

  <br />

  **EN** | [ES](README.es.md)

  <br />

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-biskoto--ecommerce.vercel.app-3ECF8E?style=flat-square&logo=vercel&logoColor=white)](https://biskoto-ecommerce.vercel.app)

</div>

<br />

## 📖 Table of Contents

- [1. What is Biskoto?](#-what-is-biskoto)
- [2. Features](#-features)
- [3. Authentication System](#-authentication-system)
- [4. Architecture](#️-architecture)
- [5. Tech Stack](#-tech-stack)
- [6. Documentation](#-documentation)
- [7. Quick Start](#-quick-start)
- [8. Screenshots](#-screenshots)
- [9. Live Demo](#-live-demo)
- [10. License](#-license)

<br />

---

<br />

## 🍪 What is Biskoto?

**Biskoto** is an e-commerce solution designed for artisanal bakery businesses. It allows customers to browse the catalog, manage their shopping cart, and place orders, while administrators control inventory, products, ingredients, suppliers, and the complete sales flow, all from a modern interface with dark mode support.

<br />

## ✨ Features

<table>
<tr>
<td width="50%">

### For Customers
- Browse the **product catalog** with images and prices
- **Shopping cart** management with real-time stock validation
- **User profile** with order history
- Secure **authentication** system with password recovery
- **Dark / Light mode** support

</td>
<td width="50%">

### For Administrators
- **Admin dashboard** with full CRUD capabilities
- Management of **products**, **categories**, and **ingredients**
- **Inventory** and **suppliers** control
- **User** and role administration
- **Order** processing and tracking

</td>
</tr>
</table>

<br />

## 🔐 Authentication System

| Feature | Description |
|:---|:---|
| **Secure Registration** | Handled by Supabase Auth |
| **JWT Sessions** | Tokens with automatic refresh |
| **Roles** | Customer · Administrator |
| **Protected Routes** | Restricted access based on permissions |
| **Password Recovery** | Full email flow |

<br />

---

<br />

## 🏗️ Architecture

```text
biskoto-ecommerce/
│
├── frontend/                         # React + Vite App
│   └── src/
│       ├── api/                      # Backend communication services
│       ├── assets/                   # Images, logos, and icons
│       ├── components/               # Reusable UI components
│       ├── context/                  # Global state
│       ├── pages/                    # Views (admin, auth, home, shop, user)
│       └── App.jsx                   # Main routing
│
├── backend/                          # REST API with Express
│   └── src/
│       ├── config/                   # Supabase client setup
│       ├── controllers/              # Business logic
│       ├── middleware/               # Auth and validation
│       └── routes/                   # Endpoint definitions
│
├── database/                         # SQL Scripts
│   ├── schema.sql
│   ├── seed.sql
│   └── auth_trigger.sql
│
└── docs/                             # Documentation and screenshots
```

<br />

## 💻 Tech Stack

<table>
<tr>
<td align="center" width="33%">
<br />

**Frontend**

<br />

| Technology | Usage |
|:---:|:---|
| React | User Interface |
| Vite | Build & Dev Server |
| Tailwind CSS | Design System |
| React Router | SPA Navigation |
| Context API | Global State |

</td>
<td align="center" width="33%">
<br />

**Backend**

<br />

| Technology | Usage |
|:---:|:---|
| Node.js | Runtime |
| Express | HTTP Framework |
| Supabase | Database (PostgreSQL) |
| JWT | Authentication |
| Axios | HTTP Client |

</td>
<td align="center" width="33%">
<br />

**Services**

<br />

| Technology | Usage |
|:---:|:---|
| Supabase Auth | Authentication |
| Supabase Storage| Image Storage |
| Vercel | Frontend Deployment |
| Render | Backend Deployment |

</td>
</tr>
</table>

<br />

---

<br />

## 📚 Documentation

Detailed documentation files can be found in the `docs/` folder:

- 📝 [**Technical Manual**](docs/MANUAL_TECNICO.md) *(Note: The file is in Spanish)*
- 📘 [**User Manual**](docs/Manual%20de%20Usuario%20-%20Biskoto.docx) *(Note: The file is in Spanish)*
- 🧪 [**Test Plan**](docs/Plan%20de%20Pruebas%20-%20Proyecto%20de%20Biskoto.pdf) *(Note: The file is in Spanish)*

<br />

---

<br />

## 🚀 Quick Start

### Prerequisites

| Software | Minimum Version |
|:---|:---|
| [Node.js](https://nodejs.org/) | `v18+` |
| [Git](https://git-scm.com/) | Any recent version |
| [Supabase](https://supabase.com/) Account | — |

<br />

<details>
<summary><strong>1. Clone the repository</strong></summary>

<br />

```bash
git clone https://github.com/DanielAR27/biskoto-ecommerce.git
cd biskoto-ecommerce
```

</details>

<details>
<summary><strong>2. Configure environment variables</strong></summary>

<br />

**`backend/.env`**
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

</details>

<details>
<summary><strong>3. Run the backend</strong></summary>

<br />

```bash
cd backend
npm install
npm run dev
```

> The server will run at `http://localhost:3000`

</details>

<details>
<summary><strong>4. Run the frontend</strong></summary>

<br />

```bash
cd frontend
npm install
npm run dev
```

> The application will be available at `http://localhost:5173`

</details>

<br />

---

<br />

## 📸 Screenshots

Screenshots are available in the [`docs/screenshots/`](docs/screenshots/) folder.

<br />

<div align="center">

### 🏠 Home

Main page featuring the highlighted product catalog, navigation, and sidebar cart.

<img src="docs/screenshots/biskoto_home.png" alt="Home Page" width="700" />

<br />

---

### 🛍️ Product Catalog

Catalog view with product cards, pricing, and real-time stock availability tracking.

<img src="docs/screenshots/biskoto_catalog.png" alt="Catalog" width="700" />

<br />

---

### 🛒 Shopping Cart

Sidebar cart displaying a product summary, quantities, stock validation, and total purchase amount.

<img src="docs/screenshots/biskoto_shopcart.png" alt="Shopping Cart" width="700" />

<br />

---

### 🔑 Authentication

Login and registration pages with dark mode support and email password recovery.

<img src="docs/screenshots/biskoto_login.png" alt="Authentication" width="700" />

<br />

---

### 🛠️ Admin Dashboard

Comprehensive dashboard for CRUD management of products, ingredients, suppliers, categories, and users.

<img src="docs/screenshots/biskoto_products.png" alt="Admin Dashboard" width="700" />

</div>

<br />

---

<br />

## 🌐 Live Demo

| | |
|:---|:---|
| **Frontend** | [biskoto-ecommerce.vercel.app](https://biskoto-ecommerce.vercel.app) |
| **Backend** | Render (Node.js + Express) |
| **Database** | Supabase (PostgreSQL) |

<br />

---

<br />

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<br />

---

<br />

<div align="center">

  Made by **Luis Meza** and **Daniel Alemán**

  <sub>© 2025 Biskoto · Academic Project</sub>

</div>
