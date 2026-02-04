# TV Dashboard - Visual Factory

Dashboard de visualización para órdenes de trabajo diseñado para pantallas de TV en entornos de producción.

## 🚀 Características

### Funcionalidades Principales
- **Dashboard en tiempo real**: Visualización automática de órdenes de trabajo con actualizaciones en vivo
- **Rotación automática entre compañías**: La vista TV rota por compañía; todas las órdenes de la compañía actual se muestran en una sola vista (sin paginación)
- **Panel de administración**: Gestión completa de órdenes (crear, editar, eliminar)
- **Estadísticas avanzadas**: Dashboard de métricas y análisis con gráficos
- **Configuración personalizable**: Ajustes de tiempo de rotación entre compañías y aspecto del dashboard
- **Diseño responsivo**: Optimizado para pantallas de TV y monitores grandes

### Nuevas Características
- **Filtros avanzados**: Búsqueda por múltiples campos, rango de fechas, filtros guardados
- **Operaciones en lote**: Selección múltiple, edición masiva, eliminación masiva
- **Búsqueda mejorada**: Debounce automático, búsqueda por campos específicos
- **Mensajes de error mejorados**: Mensajes descriptivos con sugerencias de solución
- **Rate limiting**: Protección contra spam y abuso
- **TypeScript**: Código completamente tipado para mayor seguridad

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase con base de datos configurada

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd tv-dashboard-next
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto:

**Opción 1 (Recomendado para Vite):**
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```
O también puedes usar:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_anonima_de_supabase
```

**Opción 2 (Compatible con Create React App):**
```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_anonima_de_supabase
```

La aplicación acepta todos estos formatos automáticamente.

4. Configurar la base de datos:
Ejecutar el script SQL en `supabase/schema.sql` en tu proyecto de Supabase.

## 🚀 Desarrollo

Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000` y también por IP en la red (por defecto escucha en todas las interfaces).

**Modo local o por IP:**
- `npm run dev:local` — Solo localhost (no accesible desde otros dispositivos).
- `npm run dev:ip` — Red: accesible por tu IP (ej. `http://192.168.1.x:3000`) para TV u otros equipos.
- Variable `HOST=local` o `HOST=network` en `.env` o al ejecutar también aplica (ej. `HOST=local npm run dev`).

## 🧪 Testing

Ejecutar tests:
```bash
npm test
```

Ejecutar tests con UI:
```bash
npm run test:ui
```

Ejecutar tests con cobertura:
```bash
npm run test:coverage
```

## 📦 Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## 🌐 Hosting (despliegue)

Supabase no ofrece hosting de sitios estáticos como Firebase Hosting. Tienes dos opciones:

### Opción A: Supabase Storage (todo en Supabase, con limitaciones)

Sirves el build desde un **bucket público** de Storage. Las rutas usan `#` (HashRouter) para evitar 404 al recargar.

1. **Crear el bucket en Supabase**
   - Dashboard Supabase → Storage → New bucket.
   - Nombre: `web` (o el que uses en el script).
   - Marcar **Public bucket**.
   - Para subir con el script: en Policies, permitir `INSERT` al rol `anon` en ese bucket, o usar `SUPABASE_SERVICE_ROLE_KEY` en el script (solo en entorno seguro).

2. **Build para Storage (base path opcional)**  
   Si la app se sirve desde una subruta (ej. `.../storage/v1/object/public/web/`), genera el build con base:
   ```bash
   VITE_BASE_URL=/storage/v1/object/public/web/ npm run build
   ```
   Para probar en local sin subruta, usa `npm run build` sin `VITE_BASE_URL`.

3. **Subir el build al bucket (desde tu máquina, local)**
   ```bash
   npm run upload:storage
   ```
   Hace `build` y sube `dist/` en un solo comando. Si ya tienes `dist/` generado:
   ```bash
   npm run deploy:storage
   ```
   Por defecto usa el bucket `web`. Otro bucket: `node scripts/deploy-storage.js mi-bucket`.

   Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (o `SUPABASE_SERVICE_ROLE_KEY` para uploads si anon no tiene permiso).

4. **URL de la app**
   `https://<project_ref>.supabase.co/storage/v1/object/public/web/index.html`

### Opción B (recomendada): Host externo + Supabase como backend

Frontend en Vercel, Netlify o Cloudflare Pages; Supabase solo como backend (DB, Auth, etc.).

1. **Vercel:** conectar el repo y desplegar. El proyecto incluye `vercel.json` (build: `npm run build`, salida: `dist`, rewrites SPA).
2. **Netlify:** `netlify deploy --prod` o integración con Git. Usar `netlify.toml` (build y redirect `/*` → `/index.html`).
3. **Variables de entorno en el host:** en el panel del host, configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (los mismos nombres que en desarrollo).
4. Build en el host: comando `npm run build`, directorio de publicación `dist`.

## 🌐 Despliegue en Red Local

Para hacer que la aplicación sea accesible desde otras computadoras en la misma red local (por ejemplo, una computadora conectada a una TV):

### Opción 1: Servidor de Desarrollo (Rápido)

El servidor de desarrollo ya está configurado para ser accesible en la red local:

```bash
npm run dev
```

La aplicación estará disponible en:
- **Local**: `http://localhost:3000`
- **Red local**: `http://[TU-IP-LOCAL]:3000`

### Opción 2: Build de Producción (Recomendado)

Para mejor rendimiento y estabilidad en uso continuo:

1. **Crear el build de producción:**
```bash
npm run build
```

2. **Servir el build en la red local:**
```bash
npm run serve:prod
```

La aplicación estará disponible en:
- **Local**: `http://localhost:3000`
- **Red local**: `http://[TU-IP-LOCAL]:3000`

### Encontrar tu IP Local

**Windows:**
```powershell
ipconfig
```
Busca la dirección IPv4 en "Adaptador de Ethernet" o "Adaptador de LAN inalámbrica" (generalmente algo como `192.168.x.x` o `10.x.x.x`).

**Alternativa rápida:**
```powershell
ipconfig | findstr IPv4
```

**Linux/Mac:**
```bash
ip addr show
# o
ifconfig
```

### Acceder desde otra computadora

1. Asegúrate de que ambas computadoras estén en la misma red Wi-Fi/Ethernet
2. En la computadora con la TV, abre un navegador
3. Ingresa: `http://[IP-DE-LA-COMPUTADORA-SERVIDOR]:3000`
   - Ejemplo: `http://192.168.1.100:3000`

### Configurar Firewall (Windows)

Si no puedes acceder desde otra computadora, es probable que el firewall esté bloqueando el puerto:

1. Abre "Firewall de Windows Defender" desde el menú de inicio
2. Haz clic en "Configuración avanzada"
3. Selecciona "Reglas de entrada" → "Nueva regla"
4. Elige "Puerto" → Siguiente
5. Selecciona "TCP" y escribe `3000` en "Puertos locales específicos"
6. Selecciona "Permitir la conexión"
7. Aplica a todos los perfiles
8. Dale un nombre (ej: "TV Dashboard - Puerto 3000")

**Alternativa rápida (PowerShell como Administrador):**
```powershell
New-NetFirewallRule -DisplayName "TV Dashboard" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Configurar IP Estática (Opcional)

Para evitar que la IP cambie al reiniciar la computadora:

1. Abre "Configuración de red" en Windows
2. Ve a "Cambiar opciones del adaptador"
3. Click derecho en tu adaptador de red → "Propiedades"
4. Selecciona "Protocolo de Internet versión 4 (TCP/IPv4)" → "Propiedades"
5. Selecciona "Usar la siguiente dirección IP"
6. Ingresa:
   - **Dirección IP**: Tu IP actual (ej: `192.168.1.100`)
   - **Máscara de subred**: Generalmente `255.255.255.0`
   - **Puerta de enlace predeterminada**: La IP de tu router (ej: `192.168.1.1`)
   - **Servidor DNS preferido**: Puedes usar `8.8.8.8` (Google) o la IP de tu router

### Notas Importantes

- **Desarrollo**: `npm run dev` es ideal para desarrollo y pruebas rápidas
- **Producción**: `npm run build` + `npm run serve:prod` es mejor para uso continuo en TV
- La IP local puede cambiar si no configuras una IP estática
- Asegúrate de que el firewall permita conexiones en el puerto 3000
- Ambas computadoras deben estar en la misma red local

## 🏗️ Arquitectura del Proyecto

```
tv-dashboard-next/
├── src/
│   ├── components/          # Componentes React (TypeScript)
│   │   ├── AdvancedFilters.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── ErrorDisplay.tsx
│   │   ├── OrderCard.tsx
│   │   ├── OrderForm.tsx
│   │   ├── OrderTable.tsx
│   │   ├── StatsDashboard.tsx
│   │   └── TVDashboard.tsx
│   ├── hooks/               # Custom hooks (TypeScript)
│   │   ├── useFullscreen.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useToast.ts
│   │   ├── useWorkOrders.ts
│   │   └── useWorkOrderActions.ts
│   ├── types/               # Definiciones de tipos TypeScript
│   │   ├── workOrder.ts
│   │   ├── settings.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── utils/               # Utilidades y helpers
│   │   ├── constants.ts
│   │   ├── dateFormatter.ts
│   │   ├── debounce.ts
│   │   ├── envValidation.ts
│   │   ├── errorMessages.ts
│   │   ├── exportUtils.ts
│   │   ├── logger.ts
│   │   ├── rateLimiter.ts
│   │   ├── sanitize.ts
│   │   └── supabase.ts
│   ├── test/                # Configuración de tests
│   │   ├── setup.ts
│   │   └── mocks/
│   ├── styles/              # Estilos globales
│   │   └── index.css
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── supabase/
│   └── schema.sql           # Esquema de base de datos
├── public/                  # Archivos estáticos
├── tsconfig.json            # Configuración TypeScript
├── vite.config.ts           # Configuración Vite
└── vitest.config.ts         # Configuración Vitest
```

## 🎯 Rutas

La app usa HashRouter (rutas con `#`) para compatibilidad con hosting estático (ej. Supabase Storage).

- `#/` - Dashboard principal de TV
- `#/admin` - Panel de administración
- `#/stats` - Dashboard de estadísticas

## 🔧 Tecnologías

### Core
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y bundler
- **Supabase** - Backend y base de datos
- **Tailwind CSS** - Estilos utility-first
- **React Router** - Enrutamiento
- **Lucide React** - Iconos

### Testing
- **Vitest** - Test runner
- **@testing-library/react** - Testing utilities
- **@testing-library/jest-dom** - Matchers para DOM

## 🔒 Seguridad

### Implementado
- ✅ Sanitización de inputs para prevenir XSS
- ✅ Validación de datos en cliente y servidor
- ✅ Variables de entorno para configuración sensible
- ✅ Rate limiting en operaciones críticas
- ✅ Validación de tipos en runtime
- ✅ Manejo seguro de errores
- ✅ Row Level Security (RLS) en Supabase: habilitado en `work_orders` y `work_orders_history` con políticas que permiten acceso anon (comportamiento actual). Para producción puedes restringir anon a solo lectura o usar políticas con `auth.uid()`; ver comentarios en `supabase/schema.sql`.

### Mejores Prácticas
- Todos los inputs son sanitizados antes de procesarse
- Validación estricta de tipos con TypeScript
- Rate limiting para prevenir abuso
- Mensajes de error que no exponen información sensible

## 📝 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo (por defecto accesible por IP en la red)
- `npm run dev:local` - Solo localhost
- `npm run dev:ip` - Explícitamente por red (accesible por IP)
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza build de producción
- `npm run serve:prod` - Sirve build de producción en red local (puerto 3000)
- `npm run upload:storage` - Build + sube `dist/` al bucket (upload local, un comando)
- `npm run deploy:storage` - Sube `dist/` existente al bucket de Supabase Storage (Opción A de hosting)
- `npm test` - Ejecuta tests
- `npm run test:ui` - Ejecuta tests con UI interactiva
- `npm run test:coverage` - Ejecuta tests con cobertura

## 🎨 Características de UI/UX

### Accesibilidad
- Navegación completa por teclado
- ARIA labels en todos los componentes interactivos
- Soporte para lectores de pantalla
- Contraste de colores WCAG AA
- Focus visible mejorado

### Rendimiento
- Code splitting automático
- Lazy loading de rutas
- Memoización optimizada
- Debounce en búsquedas
- Bundle optimization

### Experiencia de Usuario
- Mensajes de error descriptivos con sugerencias
- Estados de carga mejorados
- Animaciones fluidas
- Filtros avanzados con presets
- Operaciones en lote

## 🧩 Componentes Principales

### TVDashboard
Dashboard principal para visualización en pantallas TV. Rotación automática entre compañías; todas las órdenes de la compañía actual se muestran en una sola vista.

### AdminPanel
Panel de administración completo con:
- Formulario de creación/edición
- Tabla con filtros y búsqueda
- Operaciones en lote
- Exportación a CSV

### StatsDashboard
Dashboard de estadísticas con:
- Métricas generales
- Distribución por prioridad
- Estadísticas por compañía
- Progreso general

### AdvancedFilters
Sistema de filtros avanzados con:
- Búsqueda por múltiples campos
- Rango de fechas
- Filtros guardados (presets)
- Modo AND/OR

## 🔄 Flujo de Datos

```
Supabase (Realtime) 
    ↓
useWorkOrders Hook
    ↓
Components (TVDashboard, AdminPanel, StatsDashboard)
    ↓
User Interactions
    ↓
useWorkOrderActions Hook
    ↓
Supabase API
```

## 🐛 Debugging

### Desarrollo
- Errores detallados en consola (solo en desarrollo)
- ErrorBoundary con stack traces
- Logger estructurado

### Producción
- Errores genéricos para usuarios
- Logging estructurado (preparado para integración con servicios externos)

## 📊 Optimizaciones

### Bundle
- Code splitting por rutas
- Manual chunks para vendors
- Tree shaking
- Minificación con Terser

### Runtime
- Memoización de cálculos costosos
- Debounce en búsquedas
- Lazy loading de componentes
- Optimización de re-renders

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Contribución
- Usa TypeScript para todo el código nuevo
- Escribe tests para nuevas funcionalidades
- Sigue las convenciones de código existentes
- Documenta funciones complejas

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 🆘 Soporte

Para problemas o preguntas:
1. Revisa la documentación
2. Verifica los logs de error
3. Contacta al equipo de desarrollo
