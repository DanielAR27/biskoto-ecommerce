# Documentación Técnica del Proyecto Biskoto

## 1. Visión General del Proyecto

El Proyecto Biskoto es una solución integral de comercio electrónico diseñada para la gestión y venta de productos de repostería artesanal. El sistema se compone de una arquitectura cliente-servidor que separa la lógica de negocio y la gestión de datos (Backend) de la interfaz de usuario (Frontend).

El objetivo principal es administrar el inventario, procesar compras, gestionar ingredientes y ofrecer un catálogo público interactivo, asegurando la integridad de los datos mediante validaciones de stock en tiempo real.

## 2. Arquitectura Tecnológica

El sistema utiliza el siguiente stack tecnológico:

**Base de Datos y Almacenamiento:** Supabase (PostgreSQL) para datos relacionales y Supabase Storage para el alojamiento de imágenes.

**Backend:** Node.js con Express.

**Frontend:** React.js con Vite.

**Estilos:** Tailwind CSS.

**Gestión de Estado:** React Context API.

## 3. Estructura del Proyecto

A continuación, se detalla la organización de directorios y archivos principales del código fuente:
```
Proyecto-IC7841/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js           # Configuración del cliente Supabase
│   │   ├── controllers/
│   │   │   ├── authController.js     # Lógica de autenticación
│   │   │   ├── categoriaController.js
│   │   │   ├── comprasController.js  # Procesamiento de transacciones
│   │   │   ├── ingredienteController.js
│   │   │   ├── productoController.js # Lógica de productos e inventario
│   │   │   ├── proveedorController.js
│   │   │   └── usuarioController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # Protección de rutas
│   │   ├── routes/                   # Definición de endpoints API
│   │   │   ├── authRoutes.js
│   │   │   ├── categoriasRoutes.js
│   │   │   ├── comprasRoutes.js
│   │   │   ├── ingredientesRoutes.js
│   │   │   ├── productosRoutes.js
│   │   │   └── ...
│   │   └── app.js                    # Configuración de la aplicación Express
│   ├── index.js                      # Punto de entrada del servidor
│   └── package.json
│
├── database/                         # Scripts SQL para la base de datos
│   ├── schema.sql                    # Definición de tablas
│   ├── seed.sql                      # Datos iniciales
│   ├── auth_trigger.sql              # Triggers de autenticación
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                      # Servicios de comunicación con Backend
│   │   │   ├── axiosConfig.js
│   │   │   ├── productoService.js
│   │   │   ├── authService.js
│   │   │   └── ...
│   │   ├── assets/                   # Recursos estáticos (imágenes, logos)
│   │   ├── components/               # Componentes reutilizables de UI
│   │   │   ├── navbar/
│   │   │   ├── ui/
│   │   │   ├── admin/                # Formularios administrativos
│   │   │   ├── CartDrawer.jsx        # Carrito lateral
│   │   │   ├── Navbar.jsx
│   │   │   └── ...
│   │   ├── context/                  # Gestión de estado global
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── pages/                    # Vistas de la aplicación
│   │   │   ├── admin/                # Vistas del panel de administración
│   │   │   ├── auth/                 # Login, Registro, Recuperación
│   │   │   ├── home/                 # Página principal
│   │   │   ├── shop/                 # Detalle de producto
│   │   │   └── user/                 # Perfil de usuario
│   │   ├── App.jsx                   # Enrutamiento principal
│   │   └── main.jsx                  # Punto de entrada React
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## 4. Guía de Instalación y Ejecución

Para desplegar el proyecto en un entorno local, siga los siguientes pasos:

### Prerrequisitos

- Node.js (versión 16 o superior).
- Cuenta activa en Supabase.
- Git instalado.

### Configuración del Backend

Navegue al directorio del servidor:
```bash
cd backend
```

Instale las dependencias necesarias:
```bash
npm install
```

Cree un archivo `.env` en la raíz de backend con las siguientes variables:
```
PORT=3000
SUPABASE_URL=su_url_de_supabase
SUPABASE_KEY=su_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=su_service_role_key
```

Inicie el servidor:
```bash
npm start
```

### Configuración del Frontend

Navegue al directorio del cliente:
```bash
cd frontend
```

Instale las dependencias necesarias:
```bash
npm install
```

Cree un archivo `.env` en la raíz de frontend para la conexión con el API:
```
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=su_url_de_supabase
VITE_SUPABASE_ANON_KEY=su_anon_key_de_supabase
```

Ejecute la aplicación en modo desarrollo:
```bash
npm run dev
```

## 5. Módulos y Funcionalidades Actuales

- **Catálogo de Productos:** Visualización de productos con imágenes, precios y descripciones. Detección automática de disponibilidad basada en inventario.
- **Gestión de Carrito:** Persistencia de datos local, validación de stock en tiempo real contra el servidor y cálculo de totales.
- **Panel Administrativo:** CRUD completo para Productos, Ingredientes, Proveedores y Categorías.
- **Gestión de Inventario:** Control de stock de ingredientes y productos terminados.
- **Autenticación:** Sistema de registro e inicio de sesión seguro, con roles de usuario y administrador.

## 6. Hoja de Ruta: Mejoras y Funcionalidades Pendientes

Para optimizar el funcionamiento del Proyecto Biskoto y mejorar la experiencia de usuario, se han identificado las siguientes áreas críticas de desarrollo:


### 6.1. Optimización de Navegación y Feedback (UX)

Actualmente, al realizar acciones que conllevan redireccionamiento o actualizaciones de estado (como eliminar un registro), la posición del scroll se mantiene estática.

**Requerimiento:** Implementar `window.scrollTo(0, 0)` en las transiciones de página y tras la ejecución de notificaciones tipo "Toast" para asegurar que el usuario visualice los mensajes de confirmación o error en la parte superior de la interfaz.

### 6.2. Refinamiento en el Procesamiento de Compras

Existe una inconsistencia lógica en el manejo del carrito cuando el inventario fluctúa.

**Requerimiento A:** Implementar una limpieza automática en el paso previo al "Checkout". Los ítems que, tras la validación, resulten con una cantidad de 0 debido a falta de stock, deben ser ocultados visualmente de la lista de confirmación final o eliminados automáticamente del carrito para evitar confusión.

**Requerimiento B:** Manejar casos de borde donde un producto previamente agotado recupera stock. El sistema debe permitir la actualización dinámica de estas cantidades sin requerir que el usuario elimine y vuelva a agregar el ítem manualmente.

---


### 6.3. Módulo de Gestión de Pedidos (Cliente Final)

Es fundamental establecer una distinción arquitectónica clara entre el módulo de "Compras" (adquisición interna de insumos a proveedores) y el módulo de "Pedidos" (transacciones de venta realizadas por los usuarios finales de la aplicación).

**Requerimiento:** Implementar un sistema de administración de pedidos de venta ("Sales Orders") que permita al personal operativo gestionar el flujo de despacho sin alterar la integridad financiera de la transacción.

- **Inmutabilidad del pedido:** Una vez confirmada la orden por el cliente, los ítems y precios pactados no deben ser modificables, garantizando la trazabilidad histórica y la coherencia contable.

- **Gestión de Estados:** Gestión de Estados: Implementar una máquina de estados finitos para el ciclo de vida del pedido (ej. "Pendiente de Pago", "Confirmado", "En Producción", "Listo para Retiro", "Entregado", "Cancelado").

- **Visualización:** Visualización: Dashboard para el seguimiento de pedidos activos, con filtros por fecha, cliente y estado.

### 6.4. Procesamiento de Pagos y Checkout (Funcionalidad Crítica)

El cierre del ciclo de venta requiere la implementación de una pasarela de pagos robusta y un sistema de incentivos comerciales.

**Gestión de Cupones de Descuento:** 

- Desarrollar la lógica de validación para códigos promocionales (cupones) en el carrito de compras.

- Soportar diferentes tipos de descuento (porcentaje, monto fijo) y reglas de aplicación (fecha de expiración, monto mínimo de compra, límite de usos).

**Integración con Pasarela de Pagos:** 

- Implementar un servicio de procesamiento de pagos seguro (Payment Gateway Integration) mediante proveedores estándar de la industria como Stripe o equivalentes locales.

- El sistema debe manejar la confirmación asíncrona del pago (Webhooks) para actualizar automáticamente el estado del pedido y descontar el inventario final de productos terminados.

- Garantizar el cumplimiento de estándares de seguridad (PCI-DSS) delegando el manejo de datos sensibles de tarjetas a la pasarela seleccionada

---

*Documento generado para uso interno del equipo de desarrollo del Proyecto Biskoto.*