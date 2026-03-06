# Auditoría de Software — TV Dashboard Next

**Fecha:** 2026-03-06  
**Auditor:** Agente Senior (React / TypeScript / Supabase)  
**Herramientas usadas:** `tsc --noEmit`, ESLint, lectura manual de código  
**Resultado ESLint:** ✅ Sin errores ni advertencias  
**Resultado TypeScript:** ❌ 1 error de compilación (ver ítem C-03)

---

## Resumen Ejecutivo

Se auditaron **100+ archivos** del proyecto. Se encontraron **25 problemas** distribuidos en 4 niveles de prioridad. Los problemas más críticos comprometen la **seguridad** (auth bypasseada en producción, double-encoding de datos), la **corrección funcional** (bulk actions sin invalidar caché, tipos de Supabase vacíos) y la **estabilidad** (error de compilación TypeScript, inyección de regex).

---

## 🔴 PRIORIDAD CRÍTICA

Problemas que representan riesgos de seguridad activos, corrupción de datos o que rompen el compilador. Deben resolverse **antes de cualquier deploy a producción**.

---

### C-01 — Autenticación completamente bypasseada en producción

- **Archivo:** `src/hooks/useAuth.ts`
- **Líneas:** 1–22
- **Descripción:** El hook real de autenticación fue reemplazado por un stub que devuelve siempre un usuario falso hardcodeado (`FAKE_USER = { id: 'dev-bypass', email: 'dev@local' }`). El comentario dice _"Auth bypassed temporarily for development"_, pero este código está en la rama principal. Cualquier persona puede acceder al panel de administración (`/admin`) sin credenciales.
- **Impacto:** Exposición total del panel administrativo. Cualquier usuario puede crear, editar y eliminar órdenes de trabajo sin autenticarse.
- **Propuesta de solución:** Restaurar la implementación original de `useAuth` que use `supabase.auth.getSession()` y `supabase.auth.onAuthStateChange()`. Si no existe, crearla y asegurarse de que el route `/admin/*` redirija a login cuando `user === null`.

---

### C-02 — Tipos de Supabase vacíos: todas las consultas son type-unsafe

- **Archivo:** `src/types/supabase.ts`
- **Líneas:** 9–16
- **Descripción:** La interfaz `Database` tiene `Tables: Record<string, never>`. Esto hace que el cliente de Supabase no tenga información de tipos sobre ninguna tabla. Como consecuencia, cada respuesta se castea explícitamente con `as WorkOrder` o `as WorkOrder[]` en lugar de derivarse del schema real.
- **Evidencia adicional:** En `src/types/workOrder.ts` existe un `TODO` que admite esta deuda técnica. Cualquier cambio en el schema de la base de datos pasará desapercibido hasta runtime.
- **Impacto:** Los tipos de la API son "mentiras compilables". Un campo añadido/eliminado en Supabase no causará error de TypeScript, sino un bug silencioso en producción.
- **Propuesta de solución:** Ejecutar `npm run update-types` (el script `scripts/update-supabase-types.js` ya existe) con `SUPABASE_PROJECT_ID` configurado en `.env`. Luego reemplazar los tipos manuales de `workOrder.ts` con los tipos derivados: `type WorkOrder = Database['public']['Tables']['work_orders']['Row']`.

---

### C-03 — Error de compilación TypeScript en `SettingsPage.tsx`

- **Archivo:** `src/components/SettingsPage.tsx`
- **Línea:** 54–61
- **Error exacto:** `error TS2345: Argument of type '((event: BeforeUnloadEvent) => void) | undefined' is not assignable to parameter of type '(event: BeforeUnloadEvent) => any'. Type 'undefined' is not assignable to type '...'.`
- **Descripción:** Se pasa `undefined` a `useBeforeUnload()` cuando `hasChanges` es `false`, pero el tipo del hook no acepta `undefined`. El código usa un operador ternario sin un fallback válido.
- **Propuesta de solución:** Envolver la llamada en un condicional o pasar una función vacía como fallback:
  ```tsx
  // Opción A: solo registrar cuando hasChanges es true
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasChanges) event.preventDefault();
      },
      [hasChanges]
    )
  );
  ```

---

### C-04 — `sanitizeText` provoca double-encoding HTML al almacenar en Supabase

- **Archivos:** `src/utils/sanitize.ts`, `src/utils/validationSchemas.ts`, `src/features/orders/api/workOrders.ts`
- **Líneas clave:** `sanitize.ts:37`, `validationSchemas.ts:136`
- **Descripción:** La función `sanitizeText` llama a `escapeHtml` antes de guardar los datos, convirtiendo `<`, `>`, `&`, `"`, `'` en entidades HTML (`&lt;`, `&amp;`, etc.). Esos valores escapados se persisten en la base de datos. Cuando React renderiza esos valores en JSX (que ya escapa el HTML de forma interna), el usuario verá `&amp;` en lugar de `&`, o `&lt;` en lugar de `<`.
- **Ejemplo concreto:** Un cliente llamado `R&D Corp` se almacena como `R&amp;D Corp` y se muestra en la UI como el texto literal `R&amp;D Corp`.
- **Propuesta de solución:** Eliminar `escapeHtml` de `sanitizeText`. El escape para el DOM lo hace React automáticamente. Para proteger contra XSS, es suficiente con el `trim()` y `slice()`. Reemplazar por: `return input.trim().slice(0, maxLength)`.

---

## 🟠 PRIORIDAD ALTA

Bugs funcionales o de lógica que afectan el comportamiento correcto del sistema en condiciones normales de uso.

---

### A-01 — `useBulkActions` no invalida el caché de React Query

- **Archivo:** `src/hooks/useBulkActions.ts`
- **Líneas:** 17–175
- **Descripción:** Las funciones `bulkUpdateStatus`, `bulkUpdatePriority`, `bulkUpdateCompany` y `bulkDelete` realizan mutaciones directas a Supabase, pero **nunca llaman a `queryClient.invalidateQueries()`**. Esto deja el caché de React Query obsoleto. Después de una operación masiva, la tabla no se actualiza hasta el próximo auto-refresh o hasta que el usuario refresca manualmente.
- **Evidencia:** El hook `useWorkOrderActions` (refactorizado y correcto) sí invalida el caché en `onSettled`. `useBulkActions` fue escrito de forma independiente y omitió este paso.
- **Propuesta de solución:** Importar `useQueryClient` en `useBulkActions`, obtener la instancia del cliente y llamar `queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })` en el bloque `finally` de cada función.

---

### A-02 — `BulkActionsBar` no refresca datos después de operaciones masivas

- **Archivo:** `src/components/BulkActionsBar.tsx`
- **Líneas:** 51–87
- **Descripción:** El callback `onActionComplete()` que recibe `BulkActionsBar` es definido en `OrderDataTable.tsx` como `() => setRowSelection({})`, es decir, solo limpia la selección. No llama a `refetch()`. Combinado con el problema A-01, esto significa que la tabla nunca se actualiza con los datos reales de la BD tras una operación masiva.
- **Propuesta de solución:** Resolver A-01 (invalidar caché) y actualizar la prop `onActionComplete` para que también llame a `refetch()` o depender únicamente de la invalidación del caché.

---

### A-03 — Inyección de RegExp en `highlightText` (DoS/error en runtime)

- **Archivo:** `src/features/orders/components/OrderTable/columns.tsx`
- **Líneas:** 9–21
- **Descripción:** La función construye un `RegExp` dinámico con el `searchTerm` del usuario sin escapar los caracteres especiales de regex: `new RegExp(`(${searchTerm})`, 'gi')`. Si el usuario escribe caracteres como `(`, `)`, `[`, `*`, `+`, `?`, el código lanza un `SyntaxError: Invalid regular expression` que, al no estar capturado, puede romper el renderizado de toda la tabla.
- **Propuesta de solución:** Escapar el término de búsqueda antes de usarlo en el RegExp:
  ```ts
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  ```

---

### A-04 — `useWorkOrderActions`: `success` siempre es `null`, contrato roto

- **Archivo:** `src/features/orders/hooks/useWorkOrderActions.ts`
- **Línea:** 283
- **Descripción:** El hook expone `success: string | null` en su interfaz pública, pero la implementación hardcodea `const success = null`. `AdminPanel.tsx` tiene un `useEffect` (líneas 82–86) que escucha `actionSuccess` para mostrar toasts de éxito. Este efecto **nunca se ejecutará** porque `success` jamás toma un valor distinto de `null`.
- **Contexto adicional:** `AdminPanel.tsx` compensa este bug llamando a `showSuccess()` directamente dentro de cada `handleXxx`, lo que crea lógica duplicada y hace que el contrato del hook sea engañoso.
- **Propuesta de solución:** Eliminar `success` del valor retornado por el hook (y de la interfaz `UseWorkOrderActionsReturn`) y el `useEffect` que lo escucha en `AdminPanel.tsx`, ya que la retroalimentación se maneja correctamente en los handlers individuales.

---

### A-05 — `quickUpdatePriority` no valida ni sanitiza la entrada

- **Archivo:** `src/features/orders/hooks/useWorkOrderActions.ts`
- **Líneas:** 241–248 (comparar con líneas 229–238)
- **Descripción:** `quickUpdateStatus` valida y sanitiza el parámetro `status` con `sanitizeEnum` antes de enviarlo a la API. `quickUpdatePriority` no tiene ninguna validación equivalente: envía directamente el valor recibido a Supabase.
- **Propuesta de solución:** Agregar la misma validación que tiene `quickUpdateStatus`:
  ```ts
  const sanitizedPriority = sanitizeEnum(
    priority,
    VALID_PRIORITIES,
    'normal' as Priority
  );
  if (sanitizedPriority !== priority)
    return { success: false, error: 'Prioridad inválida' };
  ```

---

### A-06 — Doble verificación inútil de `ordersLoading` en `AdminPanel` (código muerto)

- **Archivo:** `src/components/AdminPanel.tsx`
- **Líneas:** 323–325 (early return) y 493–494 (render condicional)
- **Descripción:** El componente retorna `<LoadingState />` en la línea 323 si `ordersLoading` es `true`. Sin embargo, en el JSX principal (línea 493), hay otro condicional `ordersLoading ? <SkeletonTable /> : <OrderTable .../>`. Esta segunda verificación es código muerto porque el early return de línea 323 garantiza que nunca se alcanzará.
- **Propuesta de solución:** Eliminar el operador ternario de la línea 493 y renderizar directamente `<OrderTable>`. El `SkeletonTable` solo se vería si se elimina el early return de línea 323.

---

### A-07 — Inconsistencia entre paginación y virtualización en `OrderDataTable`

- **Archivo:** `src/features/orders/components/OrderTable/OrderDataTable.tsx`
- **Líneas:** 94–95, 286–317
- **Descripción:** Cuando `filteredOrders.length > 50` (umbral de virtualización), `tableData` se asigna a `filteredOrders` completo (sin paginar), y el componente `<List>` de `react-window` renderiza todos los registros. Sin embargo, los controles de paginación (`<OrderTablePagination>`) siguen visibles y calculan páginas basándose en `filteredOrders.length`. Los controles de paginación se muestran pero no tienen efecto real en la vista virtualizada.
- **Propuesta de solución:** Ocultar los controles de paginación cuando el modo virtualizado está activo (`filteredOrders.length > VIRTUALIZATION_THRESHOLD`), o implementar paginación real en el modo virtualizado pasando el `paginatedOrders` al componente `<List>`.

---

## 🟡 PRIORIDAD MEDIA

Malas prácticas, problemas de rendimiento o comportamientos incorrectos que no son críticos pero degradan la experiencia o mantenibilidad.

---

### M-01 — Dark mode forzosamente deshabilitado en `App.tsx`

- **Archivo:** `src/App.tsx`
- **Líneas:** 24–32
- **Descripción:** Un `useEffect` que se ejecuta en cada montaje elimina la clase `dark` del DOM y borra la preferencia de tema del localStorage. Esto hace que el dark mode sea imposible de activar, aunque exista toda la infraestructura para ello en `useAppearanceSettings`.
- **Propuesta de solución:** Eliminar este `useEffect` si el dark mode está en desarrollo. Si fue desactivado intencionalmente, agregar un comentario explicativo claro y/o un feature flag controlado por settings.

---

### M-02 — `fetchWorkOrders` carga TODOS los registros sin paginación en servidor

- **Archivo:** `src/features/orders/api/workOrders.ts`
- **Líneas:** 12–24
- **Descripción:** La query `supabase.from('work_orders').select('*')` no tiene `.limit()`, `.range()` ni ninguna restricción. Supabase tiene un límite por defecto de 1,000 filas. Con más de 1,000 órdenes, los datos se truncarán silenciosamente sin error. Con menos registros pero muchos campos, el payload sigue siendo ineficiente.
- **Propuesta de solución:** Implementar paginación del lado del servidor. Refactorizar `fetchWorkOrders` para aceptar `{ page, pageSize }` y usar `.range(start, end)` en Supabase. Actualizar React Query para pasar los parámetros de página como parte del `queryKey`.

---

### M-03 — `saveSettings` se recrea en cada render (no está memoizada)

- **Archivo:** `src/hooks/useAppSettings.ts`
- **Líneas:** 144–148
- **Descripción:** La función `saveSettings` está definida como una función regular dentro del hook, no como un `useCallback`. Esto significa que su referencia cambia en cada render, causando re-renders innecesarios en todos los componentes que reciben `saveSettings` como prop o la usan en dependencias de efectos.
- **Propuesta de solución:** Envolver con `useCallback`:
  ```ts
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
    window.dispatchEvent(
      new CustomEvent('settings-changed', { detail: newSettings })
    );
  }, []);
  ```

---

### M-04 — `useKeyboardShortcuts` recibe objeto de shortcuts inestable

- **Archivo:** `src/components/AdminPanel.tsx` y `src/hooks/useKeyboardShortcuts.ts`
- **Líneas:** `AdminPanel.tsx:237–258`, `useKeyboardShortcuts.ts:19–43`
- **Descripción:** El objeto `shortcuts` se pasa como literal de objeto `{ 'ctrl+n': (e) => {...}, ... }` en cada render. Esto crea una nueva referencia en cada render, haciendo que el `useCallback` en `useKeyboardShortcuts` y su `useEffect` dependiente se re-ejecuten innecesariamente (re-registro del listener `keydown` en cada render de `AdminPanel`).
- **Propuesta de solución:** Envolver el objeto de shortcuts con `useMemo` en `AdminPanel` antes de pasarlo al hook, o refactorizar el hook para usar un `useRef` interno para el objeto de shortcuts.

---

### M-05 — Múltiples instancias del event listener `settings-changed`

- **Archivo:** `src/hooks/useAppSettings.ts`
- **Líneas:** 125–141
- **Descripción:** Cada componente que llame a `useAppSettings()` registra su propio listener para el evento `settings-changed` en `window`. Si `useAppSettings` se usa en 3 componentes simultáneamente (ej: `AdminPanel`, `TVDashboard`, `SettingsPage`), habrá 3 listeners activos que actualizarán sus propios estados de forma independiente cuando la configuración cambie. No es un bug crítico (todos reciben el mismo valor), pero genera renders innecesarios.
- **Propuesta de solución:** Mover el estado de settings a un `Context` React con un único `Provider` en el árbol de componentes, o usar el patrón de `useSyncExternalStore` con un store singleton.

---

### M-06 — `Logger` crea un `setInterval` que nunca se destruye

- **Archivo:** `src/utils/logger.ts`
- **Líneas:** 44–46, 169–176
- **Descripción:** El constructor de `Logger` crea un `setInterval` de 30 segundos para el flush de errores en producción. El método `destroy()` que limpiaría este timer existe, pero **nunca es llamado** en ningún punto del código. El event listener `beforeunload` solo llama a `flush()`, no a `destroy()`. El timer de `setInterval` nunca se cancela durante la vida de la aplicación.
- **Propuesta de solución:** Cambiar el `beforeunload` handler para llamar a `logger.destroy()` en lugar de `logger.flush()` (ya que `destroy` llama a `flush` internamente).

---

### M-07 — `ColumnManager.onColumnsChange` es siempre un no-op

- **Archivo:** `src/features/orders/components/OrderTable/OrderDataTable.tsx`
- **Línea:** 378
- **Descripción:** `<ColumnManager ... onColumnsChange={() => {}} />`. El gestor de columnas permite al usuario activar/desactivar columnas, pero el callback que debería comunicar esos cambios a la tabla es una función vacía. Los cambios de visibilidad de columnas en el `ColumnManager` no afectan el estado `columnVisibility` de `useReactTable`.
- **Propuesta de solución:** Pasar `setColumnVisibility` (o un wrapper apropiado) como `onColumnsChange` al `ColumnManager`, y alinear el formato de su output con el `Record<string, boolean>` que espera `useReactTable`.

---

### M-08 — Botones de acción solo visibles al hover (problema de accesibilidad)

- **Archivo:** `src/features/orders/components/OrderTable/columns.tsx`
- **Líneas:** 222–258
- **Descripción:** Los botones de Editar, Más opciones y Eliminar en cada fila tienen la clase `opacity-0 group-hover:opacity-100`. Esto los hace completamente invisibles para usuarios de teclado y lectores de pantalla que no activan el estado `:hover`.
- **Propuesta de solución:** Cambiar la estrategia de visibilidad: usar `opacity-0 group-hover:opacity-100 focus-within:opacity-100` para que sean visibles al recibir foco del teclado, o eliminar la ocultación y usar iconos más pequeños para mantener un layout compacto.

---

### M-09 — `useOrderTablePagination` puede causar renders en cascada

- **Archivo:** `src/components/OrderTable/hooks/useOrderTablePagination.ts`
- **Líneas:** 27–31
- **Descripción:** El segundo `useEffect` verifica `if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)`. Cambiar `currentPage` en un efecto activa un re-render, que recalcula `totalPages` como valor memo, que puede disparar el efecto de nuevo si `totalPages` cambia por el nuevo render. En la práctica converge rápido, pero genera renders adicionales en operaciones de filtrado.
- **Propuesta de solución:** Calcular y corregir `currentPage` directamente en `handlePageChange` y en `handleItemsPerPageChange`, eliminando el segundo `useEffect` completamente.

---

## 🔵 PRIORIDAD BAJA

Inconsistencias, deuda técnica, o problemas de calidad de código que no afectan la funcionalidad directamente pero dificultan el mantenimiento.

---

### B-01 — Capa de API duplicada (`src/api/` re-exporta `src/features/orders/api/`)

- **Archivos:** `src/api/workOrders.ts`, `src/api/queryKeys.ts`
- **Descripción:** Ambos archivos son simples re-exportaciones de sus contrapartes en `src/features/orders/api/`. Esto crea dos rutas de importación para los mismos módulos, lo que confunde sobre cuál usar y dificulta futuras refactorizaciones.
- **Propuesta de solución:** Eliminar `src/api/workOrders.ts` y `src/api/queryKeys.ts`. Actualizar cualquier import que use `@/api/` para que apunte directamente a `@/features/orders/api/`.

---

### B-02 — Hooks duplicados (`src/hooks/` re-exporta `src/features/orders/hooks/`)

- **Archivos:** `src/hooks/useWorkOrders.ts`, `src/hooks/useWorkOrderActions.ts`
- **Descripción:** Misma situación que B-01: son re-exportaciones puras. Mantener dos capas de hooks sin justificación añade confusión sobre la localización del código real.
- **Propuesta de solución:** Eliminar los archivos en `src/hooks/` que sólo re-exportan y actualizar los imports a la ruta canónica en `src/features/`.

---

### B-03 — Etiqueta de estado `quality` es `'Completada'` en exportUtils pero `'Calidad'` en el resto de la app

- **Archivo:** `src/utils/exportUtils.ts`
- **Línea:** 20
- **Descripción:** `STATUS_LABELS` en `exportUtils.ts` define `quality: 'Completada'`. En el resto de la app (componentes, `columns.tsx`, `BulkActionsBar`, etc.) el estado `quality` se etiqueta como `'Calidad'`. Los reportes exportados (CSV, PDF, Excel) mostrarán un valor diferente al que el usuario ve en pantalla.
- **Propuesta de solución:** Centralizar las etiquetas de estado en un único lugar (ej: `src/utils/constants.ts`) y referenciarlas tanto en los componentes como en `exportUtils`.

---

### B-04 — Consulta de historial sin límite de filas

- **Archivo:** `src/hooks/useOrderHistory.ts`
- **Línea:** 22
- **Descripción:** La query del historial también usa `select('*')` sin `.limit()`. Para órdenes con historial extenso, podría retornar cientos o miles de filas de golpe.
- **Propuesta de solución:** Agregar `.limit(100)` como valor por defecto razonable, con soporte para cargar más registros bajo demanda ("load more"), o implementar paginación en el modal de historial.

---

### B-05 — `saveSettings` no valida los datos antes de persistirlos en localStorage

- **Archivo:** `src/hooks/useAppSettings.ts`
- **Líneas:** 144–148
- **Descripción:** La carga de settings desde localStorage sí pasa por validación con Zod (`appSettingsSchema.safeParse`). Pero `saveSettings` guarda directamente en localStorage sin ninguna validación. Si por algún error de código se pasa un objeto malformado, se persistirá y se cargará sin problemas... hasta que la validación de carga lo rechace y resetee todo a defaults.
- **Propuesta de solución:** Ejecutar `appSettingsSchema.safeParse(newSettings)` dentro de `saveSettings` y lanzar un error (o loguear un warning) si la validación falla, antes de persistir.

---

## Tabla Resumen

| ID   | Prioridad  | Archivo Principal                                              | Descripción Breve                                    |
| ---- | ---------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| C-01 | 🔴 CRÍTICA | `src/hooks/useAuth.ts`                                         | Auth bypasseada, fake user en producción             |
| C-02 | 🔴 CRÍTICA | `src/types/supabase.ts`                                        | Tipos Supabase vacíos, unsafe casts everywhere       |
| C-03 | 🔴 CRÍTICA | `src/components/SettingsPage.tsx`                              | Error TypeScript en compilación (useBeforeUnload)    |
| C-04 | 🔴 CRÍTICA | `src/utils/sanitize.ts`                                        | Double-encoding HTML en datos guardados en BD        |
| A-01 | 🟠 ALTA    | `src/hooks/useBulkActions.ts`                                  | Bulk ops no invalidan caché React Query              |
| A-02 | 🟠 ALTA    | `src/components/BulkActionsBar.tsx`                            | onActionComplete no refresca datos reales            |
| A-03 | 🟠 ALTA    | `src/features/orders/components/OrderTable/columns.tsx`        | Inyección de RegExp con searchTerm sin escapar       |
| A-04 | 🟠 ALTA    | `src/features/orders/hooks/useWorkOrderActions.ts`             | `success` hardcodeado a null, contrato roto          |
| A-05 | 🟠 ALTA    | `src/features/orders/hooks/useWorkOrderActions.ts`             | `quickUpdatePriority` sin validación de entrada      |
| A-06 | 🟠 ALTA    | `src/components/AdminPanel.tsx`                                | doble check `ordersLoading`, código muerto           |
| A-07 | 🟠 ALTA    | `src/features/orders/components/OrderTable/OrderDataTable.tsx` | Paginación y virtualización inconsistentes           |
| M-01 | 🟡 MEDIA   | `src/App.tsx`                                                  | Dark mode forzosamente deshabilitado                 |
| M-02 | 🟡 MEDIA   | `src/features/orders/api/workOrders.ts`                        | Sin paginación servidor, riesgo a escala             |
| M-03 | 🟡 MEDIA   | `src/hooks/useAppSettings.ts`                                  | `saveSettings` no memoizada                          |
| M-04 | 🟡 MEDIA   | `src/components/AdminPanel.tsx`                                | Objeto shortcuts inestable, re-registra listener     |
| M-05 | 🟡 MEDIA   | `src/hooks/useAppSettings.ts`                                  | Múltiples listeners `settings-changed` por instancia |
| M-06 | 🟡 MEDIA   | `src/utils/logger.ts`                                          | `setInterval` del Logger nunca se destruye           |
| M-07 | 🟡 MEDIA   | `src/features/orders/components/OrderTable/OrderDataTable.tsx` | `ColumnManager.onColumnsChange` es no-op             |
| M-08 | 🟡 MEDIA   | `src/features/orders/components/OrderTable/columns.tsx`        | Botones acción invisibles al teclado (a11y)          |
| M-09 | 🟡 MEDIA   | `src/components/OrderTable/hooks/useOrderTablePagination.ts`   | Renders en cascada al filtrar                        |
| B-01 | 🔵 BAJA    | `src/api/workOrders.ts`                                        | Capa API duplicada (re-export sin valor)             |
| B-02 | 🔵 BAJA    | `src/hooks/useWorkOrders.ts`                                   | Hooks duplicados (re-export sin valor)               |
| B-03 | 🔵 BAJA    | `src/utils/exportUtils.ts`                                     | Etiqueta `quality` inconsistente vs UI               |
| B-04 | 🔵 BAJA    | `src/hooks/useOrderHistory.ts`                                 | Historial sin límite de filas                        |
| B-05 | 🔵 BAJA    | `src/hooks/useAppSettings.ts`                                  | saveSettings no valida antes de persistir            |

---

_Auditoría completada. Listo para iniciar correcciones en orden de prioridad._
