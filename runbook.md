# Runbook — Sistema de Inventario Multi-Almacén

> Documento de contexto para retomar el proyecto rápidamente al iniciar una sesión.
> Última actualización: 2026-07-31.

## 1. Qué es el proyecto

Sistema de inventario de productos para una empresa con **varios almacenes y tiendas**.
Regla de negocio central: **cada almacenero solo puede ver y modificar los productos/stock
del/los almacén(es) que tiene asignado(s)**. El administrador ve y controla todo (almacenes,
tiendas, usuarios, catálogos, ajustes).

Consta de dos repos separados:

| Parte | Ruta | Stack |
|-------|------|-------|
| **Frontend** | `C:\Users\revaz\OneDrive\Documents\Work\inventario_project\code\inventario-frontend` (aquí) | React 19 + TypeScript + Vite 8 + Tailwind 4 |
| **Backend** | `C:\wamp64\www\inventario-backend` | Laravel 11 + PHP 8.2 + JWT + MySQL/MariaDB |

## 2. Modelo de dominio

**Ubicaciones (`warehouse`)** — tienen `kind`: `almacen` o `tienda`.
- Los **almaceneros** solo acceden a **almacenes** que se les asignan explícitamente
  (tabla pivote `user_warehouse`). Las **tiendas** son invisibles para ellos.
- El **admin** accede implícitamente a todos los almacenes y tiendas activos.

**Entidades principales:**
- `Product` — catálogo global. Precio base + variantes (`ProductVariant`) por atributos.
- `Stock` (`product_warehouse`) — cantidad por producto y ubicación; las **tiendas** además
  tienen `sale_price` (precio de venta) por producto.
- `Movement` + `MovementItem` — tipos: `entrada`, `salida`, `venta`, `ajuste`,
  `transferencia`, `anulacion`. Estado `activo`/`anulado`. Guardan snapshots de
  `exchange_rate` y `tax_rate`. Numerados vía `MovementCounter`.
- Catálogos: `Category`, `Unit`, `Attribute`/`AttributeValue`, `Supplier`.
- `ExchangeRate` (USD↔CUP, tasa del día), `Setting` (tax_rate, datos del negocio).
- `User` — roles: `admin` | `almacenero`; estados: `active` | `inactive` | `deleted`.

## 3. Cómo funciona el scoping por almacén (lo más importante)

El frontend envía en **cada request** el header **`X-Warehouse-Id`** (interceptor en
`src/api/client.ts`, valor desde `warehouseStorage`). El middleware backend
`ResolveWarehouse` (`app/Http/Middleware/ResolveWarehouse.php`) lo interpreta:

- **id numérico** → una ubicación concreta (usado para escrituras).
- **`all`** → todos los almacenes agregados (**solo admin**).
- **`all-tiendas`** → todas las tiendas agregadas (**solo admin**).
- **sin header** → admin: todos los almacenes; almacenero: su primer almacén.

Expone a los controladores: `warehouse_ids` (int[], para lecturas/agregados) y
`warehouse_id` (int|null, la ubicación concreta para escrituras).

Autorización en `User`: `accessibleWarehouseIds($kind)`, `canAccessWarehouse($id)`,
`isAdmin()`. Los almaceneros nunca reciben ubicaciones de tipo `tienda`.

## 4. Autenticación

- **JWT** (`php-open-source-saver/jwt-auth`). Login devuelve `token` + `refresh_token` + `user`.
- Frontend guarda tokens en `authStorage` (`src/lib/auth-storage.ts`).
- Interceptor de respuesta en `client.ts`: ante `401` intenta **refresh** una vez y
  reintenta; si falla, limpia sesión y redirige a `/login`.
- Middleware backend: `auth:api` + `active_user` (usuario activo) + `role:admin` / `warehouse`.

## 5. Rutas API (backend) — `routes/api.php`, prefijo `/api/v1`

- `auth/login`, `auth/refresh`, `auth/logout`, `auth/me`
- **Solo admin:** `/users` (CRUD + status), `/warehouses` (CRUD, `/products`,
  `/products/{p}/price`).
- **Con scope de almacén** (`warehouse` middleware): `/categories`, `/units`,
  `/attributes` (+values), `/suppliers`, `/products` (+import/preview/template,
  `/movements`, `/{p}` show/update/delete), `/exchange-rate`, `/settings/tax-rate`,
  `/settings/business`.
- **Movimientos:** `/movements/entrada|salida|venta|transferencia`, `/ajuste` (solo admin),
  `/{m}/anular`.
- **Reportes:** `/dashboard/kpis`, `/dashboard/sales`, `/reports/low-stock`,
  `/reports/movements`, `/reports/product-exits`.
- Varias operaciones de borrado/edición de catálogo requieren `role:admin`.

Controladores: `AuthController`, `UserController`, `WarehouseController`,
`CatalogController`, `ProductController`, `MovementController`, `ConfigController`,
`ReportController` (en `app/Http/Controllers/Api/V1`).

## 6. Estructura del frontend

```
src/
  api/          client.ts (axios + interceptores), resources.ts (hooks React Query)
  features/
    auth/       LoginPage, RequireAuth, auth.api.ts
    warehouse/  WarehouseContext, WarehouseSelector (selector agrupado almacenes/tiendas)
    dashboard/  DashboardPage
    app/        Pages.tsx (todas las páginas), forms.ts
  components/
    layout/     AppShell.tsx (header + nav lateral; ítems adminOnly filtrados)
    ui/         MoneyDisplay, RateBadge, StockBadge, VariantPicker, ConfirmDestructiveModal, ...
  lib/          auth-storage, warehouse-storage, env, query-client, utils
  routes/       AppRoutes.tsx
  types/        api.ts (tipos compartidos)
```

- **Estado servidor:** TanStack React Query (hooks genéricos `useList`, `usePaginated`,
  `usePost/usePut/useDelete` en `resources.ts`).
- **Navegación** (`AppShell.tsx`): Dashboard, Productos, Movimientos, Categorías, Proveedores,
  Reportes, Configuración son visibles a todos; **Unidades, Atributos, Almacenes, Tiendas,
  Usuarios son adminOnly**.
- **Formularios:** react-hook-form + zod.
- El selector de almacén en el header determina el `X-Warehouse-Id` de todas las peticiones.

## 7. Cómo levantar el entorno

**Backend** (`C:\wamp64\www\inventario-backend`, WAMP):
```bash
composer install
cp .env.example .env        # configurar DB MySQL/MariaDB
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve           # o vía WAMP en http://localhost/inventario-backend/public
```

**Frontend** (aquí):
```bash
npm install
# .env: VITE_API_BASE_URL=/api/v1 (o URL absoluta del backend), VITE_APP_NAME=Inventario
npm run dev                 # Vite
npm run build               # tsc -b && vite build
npm run lint
```

> Nota Vite dev: `VITE_API_BASE_URL` por defecto es `/api/v1` (relativo); si el backend
> corre en otro host/puerto hay que apuntar la URL absoluta o configurar un proxy en Vite.

## 8. Credenciales de desarrollo (seeders)

- **Admin:** `admin@inventario.local` / `admin123`
- **Almacenero:** `almacenero@inventario.local` / `almacen123` (asignado a almacén `PRINCIPAL`)

**Almacenes/tiendas sembrados:** `PRINCIPAL` (Almacén Guanabacoa), `SECUNDARIO`
(Almacén Alamar), `TIENDA-CENTRO` (Tienda Centro, kind=tienda).
**Settings por defecto:** `tax_rate=12.00`, `business_name=Mi Negocio`.

## 9. Estado / trabajo reciente (rama `feature/tiendas`)

Commits recientes (foco actual: **tiendas**):
- Nombre del Excel de salidas según periodo (semanal/mensual/anual/rango).
- Reportes: tarjeta de salidas por producto con selector de periodo (export Excel).
- Tiendas: selector agrupado, página Tiendas con precios y transferencia con precio de venta.
- Soporte multi-almacén: selector, transferencias y asignación por usuario.
- Refresco del listado de productos al crear/editar respetando filtros activos.

## 10. Notas / convenciones

- Divisas: precios en **USD** con conversión a **CUP** vía tasa del día; los movimientos
  guardan snapshot de tasa e impuesto para no alterar históricos.
- Respuestas de error del API: `{ error: { code, message, details? } }` — parseadas por
  `extractApiError` en `client.ts`.
- Paginación estándar: `{ data, meta: { total, page, per_page, last_page } }`.
- Hay un archivo `bash.exe.stackdump` sin trackear en ambos repos (ruido, ignorable).
- Existe `graphify-out/` en el backend (salida de la skill graphify).
```
