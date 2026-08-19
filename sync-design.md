# Diseño — Sincronización offline-first con servidor central

> Diseño acordado para publicar el Inventario en internet manteniendo trabajo local
> offline en cada almacén y sincronización con un servidor central.
> Última actualización: 2026-07-31. Ver también `runbook.md`.

## Contexto y decisiones tomadas

Hoy cada almacén corre en una laptop con su propio Laravel+MySQL, aislado. Se quiere
centralizar la información en internet, pero la conexión en los almacenes es limitada, así
que se debe poder **trabajar 100% offline y subir después**.

Decisiones confirmadas con el cliente:
1. **Arquitectura:** mantener el stack local completo en cada laptop + motor de sync.
2. **Catálogo:** los almaceneros también crean productos localmente (requiere UUIDs y dedup).
3. **Disparo de sync:** automático al detectar internet **+** botón manual "Sincronizar ahora".
4. **Datos actuales:** se arranca limpio (sin migración histórica de las laptops).

## Arquitectura

- **Central** = hub en internet; agrega todo y es la referencia de catálogo/config.
- **Cada laptop = un "nodo"** con Laravel+MySQL propio, trabaja offline.
- **Baja del central** (pull): usuarios, almacenes/tiendas, tasa de cambio, settings, catálogo consolidado.
- **Sube al central** (push): movimientos y productos creados localmente.
- **Sync:** automática al detectar internet + botón manual.

```
Laptop GUANABACOA (Laravel+MySQL) <--sync-->
                                              SERVIDOR CENTRAL (Laravel+MySQL)
Laptop ALAMAR     (Laravel+MySQL) <--sync-->
```

## Por qué el problema es tratable

El sistema ya está **particionado por almacén**: cada almacenero solo toca stock/movimientos
de su almacén, y los movimientos son **append-only** (se crean y a lo sumo se anulan, no se
editan). Por tanto **dos nodos nunca escriben sobre el mismo registro** → no hay conflictos
de escritura clásicos. Quedan 3 puntos a resolver con cuidado (abajo).

## Pieza 1 — Identidad global (IDs que no chocan)

- Cada nodo tiene un `SYNC_NODE_ID` (ej. `GUANABACOA`, `ALAMAR`, `CENTRAL`).
- Cada tabla sincronizable gana `uuid` (único) + `origin_node_id`.
- El **id entero local** se mantiene para las FKs internas; **el `uuid` es la identidad
  real entre nodos**. Al importar, se traduce `uuid → id local` (creando si falta).
- **Códigos legibles namespaced por nodo:** movimientos `GUA-ENT-000123`, productos con
  prefijo de nodo. El `MovementCounter` pasa a ser **por nodo** → nunca colisiona.

## Pieza 2 — Catálogo creado en varias laptops (dedup)

- **Dedup técnico (automático):** nunca se importa dos veces el mismo `uuid`.
- **Dedup de negocio (manual):** dos personas crean "el mismo" producto con distinto uuid →
  duplicado real que la máquina no puede adivinar. Se resuelve con una **pantalla en el
  central para fusionar productos** (mapear producto X → Y y reapuntar sus movimientos).

## Pieza 3 — Transferencias entre almacenes

- Node A crea la transferencia → stock baja en A al instante (offline).
- Sube al central y baja al nodo B; en B queda **"en tránsito"**.
- El almacenero de B **confirma la recepción** → entra el stock en B.
- Estados nuevos en la transferencia: `en_transito` | `recibido`.

## Motor de sincronización

- **Idempotente por `uuid`:** reenviar dos veces no duplica (clave con cortes de internet).
- **Cursores/watermarks:** el central asigna una secuencia creciente (`server_seq`) a cada
  registro aceptado; cada nodo pide "todo lo que tenga `server_seq` > mi último cursor".
- **Push:** el nodo envía sus cambios locales no sincronizados (upsert por uuid en central),
  el central acusa recibo, el nodo los marca como sincronizados.
- **Auth de nodo:** token de máquina por laptop, separado del JWT de usuarios.
- **Detección de conexión:** ping a `/api/v1/health`; si responde, auto-sync; + botón manual.
- **Dirección por entidad:**
  - Baja (central→nodo): usuarios, warehouses, user_warehouse, exchange_rate, settings,
    product_warehouse.sale_price (config de tienda).
  - Sube (nodo→central): movements, movement_items, productos y catálogo creados localmente.
  - Bidireccional consolidado: catálogo (products, categories, units, attributes,
    attribute_values, suppliers) — sube lo local, baja lo consolidado.
  - **Stock NO se sincroniza como filas**: es estado derivado; cada lado recalcula el stock
    de su almacén a partir de los movimientos que tiene.

## Plan por fases

| Fase | Qué | Resultado |
|------|-----|-----------|
| **0. Identidad** | `uuid` + `origin_node_id` en tablas sincronizables, `config/sync.php`, `MovementCounter`/códigos por nodo, backfill | Base lista, sin cambiar el comportamiento actual |
| **1. Motor de sync** | Endpoints `/sync/push` y `/sync/pull` en central, servicio+comando en el nodo, upsert por uuid, auth de nodo, cursores | Sincroniza catálogo (baja) y movimientos/productos (sube) |
| **2. Transferencias** | Estado `en_transito`/`recibido` + confirmar recepción en destino | Transferencias entre almacenes correctas |
| **3. Frontend** | Indicador de estado (pendientes, última sync), botón manual, auto al detectar internet, pantalla de fusión de duplicados | Experiencia completa almacenero + admin |
| **4. Despliegue** | Central en VPS con HTTPS y backups; cada laptop configurada como nodo | En producción |

## Estado de avance

- [x] **Fase 0 — Identidad** (implementada 2026-07-31, en el backend)
- [x] **Fase 1 — Motor de sync** (implementada 2026-07-31, en el backend)
- [x] **Fase 1.1 — Pivotes, settings y stock** (implementada 2026-07-31, en el backend)
- [x] **Fase 2 — Transferencias** (implementada 2026-07-31, en el backend)
- [x] **Fase 3 — Frontend** (implementada 2026-07-31)
- [ ] Fase 4 — Despliegue

## Fase 0 — Implementado (backend)

Archivos (en `C:\wamp64\www\inventario-backend`):
- `config/sync.php` — config del nodo: `node_id`, `role`, `code_prefix`, `central_url`, `node_token`.
- `.env.example` — variables `SYNC_NODE_ID`, `SYNC_ROLE`, `SYNC_CODE_PREFIX`, `SYNC_CENTRAL_URL`, `SYNC_NODE_TOKEN`.
- `app/Models/Concerns/HasSyncIdentity.php` — trait que asigna `uuid` + `origin_node_id` al crear.
- `database/migrations/2026_07_31_000001_add_sync_identity_columns.php` — añade `uuid` (único)
  + `origin_node_id` a las 11 tablas sincronizables; backfill portable; ensancha `movement.code`.
- `app/Services/MovementCodeGenerator.php` — antepone el prefijo de nodo a los códigos.
- `tests/Feature/SyncIdentityTest.php` — verifica uuid/origin y prefijo de código.

Config por instalación (en cada `.env` del backend):
- **Central:** `SYNC_NODE_ID=CENTRAL`, `SYNC_ROLE=central`, `SYNC_CODE_PREFIX=CEN`.
- **Cada laptop:** `SYNC_NODE_ID=GUANABACOA` (único), `SYNC_ROLE=node`,
  `SYNC_CODE_PREFIX=GUA` (único, corto), `SYNC_CENTRAL_URL` y `SYNC_NODE_TOKEN` (desde Fase 1).

Para aplicar: `php artisan migrate` (con MySQL levantado).

## Fase 1 — Implementado (backend)

Motor de sincronización completo en el backend:
- Tablas `sync_node`, `sync_sequence`, `sync_state`, `sync_outbox` + columna `sync_seq`.
- `config/sync.php` → `entities`: registro de las 11 entidades sincronizables.
- `SyncEngine` (serialize/import por uuid, upsert idempotente, cursores).
- `HasSyncIdentity` ampliado: central estampa `sync_seq`; nodos encolan al outbox.
- Middleware `sync.node` + endpoints `POST /api/v1/sync/pull` y `/push`.
- `SyncClient` + comandos `sync:run` (nodo) y `sync:node:create` (central).
- Tests: `tests/Feature/SyncEngineTest.php` (auth, push+FKs+idempotencia, pull).

**Para el frontend (Fase 3)** el backend expone: `POST /api/v1/sync/*` (uso interno del
nodo, no del navegador). En Fase 3 el frontend disparará `sync:run` del nodo local
(vía un endpoint/acción local) y mostrará estado: pendientes de subir (`sync_outbox`),
última sync (`sync_state`), botón manual + auto al detectar internet.

## Fase 1.1 y Fase 2 — Implementado (backend)

- **Fase 1.1:** pivotes `user_warehouse` y `product_attribute_value` embebidos por uuid en
  sus padres (`links`), `setting` por snapshot, y `product_warehouse` (stock + sale_price)
  como entidad sincronizable `up`.
- **Fase 2 (transferencias en dos fases):** `transfer_status` `en_transito`/`recibido`;
  la mercancía sale del origen al crear y entra al destino al **confirmar recepción**
  (`POST /movements/{id}/recibir`). Entrega entre nodos vía transferencias entrantes por
  `warehouse.node_id`.

## Fase 3 — Implementado (frontend)

- **Sincronización:** `src/features/sync/` — `sync.api.ts` (`useSyncStatus`, `useSyncRun`
  contra `GET/POST /api/v1/sync/status|run`) y `SyncStatusButton.tsx` en el header
  (`AppShell`): pendientes por subir, última sync, botón "Sincronizar ahora", auto-sync al
  recuperar internet + cada 5 min. Solo visible en nodos.
- **Transferencias** (`Pages.tsx` → `MovementsPage`): badge `en_transito`/`recibido`, línea
  origen→destino y acción **Recibir** (POST `/movements/{id}/recibir`).
- **Almacenes:** campo `node_id`.
- Tipos: `Movement.transfer_status`/`received_*` (`resources.ts`), `Warehouse.node_id`
  (`types/api.ts`).
- Backend de apoyo: `SyncLocalController` (`/sync/status`, `/sync/run`) autenticado por JWT.
- Verificado con `tsc -b` + `vite build`.

## Notas / riesgos

- Hacer cada fase incremental y probada antes de la siguiente; no todo de una vez.
- Cuidado con las FKs al traducir `uuid → id local` en el import (orden de dependencias:
  category/unit/attribute/supplier antes que product; product antes que movement_item).
- `product.code` y `movement.code` deben quedar namespaced por nodo para no colisionar.
- Password hashes de usuarios viajan en la bajada para permitir login offline en el nodo.
