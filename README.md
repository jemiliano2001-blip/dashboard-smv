# 📊 SMV Dashboard - Sistema de Gestión de Producción

Dashboard visual moderno para gestión de órdenes de producción con sincronización en tiempo real en la nube.

## ✨ Características

- 🔥 **Sincronización en tiempo real** con Firebase Firestore
- 📱 **Diseño responsive** optimizado para pantallas grandes (TV/monitores)
- ✏️ **Edición inline** de órdenes con confirmación visual
- 🎨 **Sistema de estados** con código de colores intuitivo
- 🔄 **Drag & drop** para reordenar órdenes
- 💾 **Auto-guardado** con respaldo automático en JSON
- 📦 **Importación/Exportación** de datos en formato JSON
- 🌓 **Modo de densidad** (Normal/Compacto)
- 🎯 **Arquitectura modular** con 14 módulos JavaScript independientes

## 🏗️ Arquitectura del Proyecto

```
tv-dashboard/
├── index.html                    # Punto de entrada principal
├── FIREBASE_SETUP.md            # Guía de configuración Firebase
├── README.md                    # Este archivo
├── assets/
│   └── images/
│       └── SMV MAQUINADOS LOGO_color azul.PNG
├── css/
│   ├── variables.css            # Variables CSS, colores, espaciado
│   ├── base.css                 # Reset, scrollbar, body, fuentes
│   ├── layout.css               # Grid, columnas, header, footer
│   ├── components.css           # Badges, botones, filas, modales
│   └── animations.css           # @keyframes y transiciones
└── js/
    ├── firebase-config.js       # Configuración Firebase (⚠️ editar aquí)
    ├── firebase.js              # Operaciones Firestore + real-time
    ├── config.js                # Constantes y configuración
    ├── state.js                 # Estado global de la aplicación
    ├── formatters.js            # Utilidades de formateo
    ├── storage.js               # Persistencia con Firestore
    ├── modal.js                 # Sistema de modales
    ├── dragdrop.js              # Drag & drop de órdenes
    ├── ui-render.js             # Renderizado del DOM
    ├── ui-interactions.js       # Event handlers
    ├── edit-mode.js             # Lógica de edición
    ├── order-operations.js      # CRUD de órdenes
    ├── export-import.js         # Exportación/importación
    ├── clock.js                 # Reloj en tiempo real
    └── main.js                  # Inicialización y orquestación
```

## 🚀 Inicio Rápido

### 1. Configurar Firebase (Requerido)

⚠️ **IMPORTANTE**: El dashboard requiere Firebase para funcionar.

1. Sigue las instrucciones detalladas en [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)
2. Copia tus credenciales en `js/firebase-config.js`
3. Configura las reglas de seguridad en Firebase Console

### 2. Abrir la Aplicación

Simplemente abre `index.html` en tu navegador web:

- **Desarrollo**: Doble clic en `index.html`
- **Producción**: Despliega en un servidor web (Firebase Hosting, Netlify, etc.)

## 🎮 Guía de Uso

### Modo Vista (Por Defecto)

- **Ver órdenes**: Organizadas en dos columnas con código de colores
- **Acciones rápidas al hover**:
  - ✏️ Editar fila específica
  - 📋 Duplicar orden
  - 🗑️ Eliminar orden

### Modo Edición

1. Click en **"Editar"** (botón inferior derecho)
2. Todas las celdas se vuelven editables
3. Acciones disponibles:
   - **+1 / +5**: Agregar órdenes nuevas
   - **Exportar**: Descargar datos en JSON
   - **Importar**: Cargar datos desde JSON
   - **Drag & Drop**: Arrastrar filas para reordenar

### Controles Principales

| Botón | Función |
|-------|---------|
| 🔄 Densidad | Alterna entre modo Normal y Compacto |
| ✏️ Editar | Activa/desactiva modo edición |
| 💾 Guardar | Guarda cambios manualmente en Firebase |
| 🖥️ Fullscreen | Modo pantalla completa |

## 🎨 Estados de Órdenes

| Estado | Color | Descripción |
|--------|-------|-------------|
| MAQUINADO | 🔵 Cyan | En proceso de maquinado |
| TEMPLE | 🟠 Naranja | En proceso de temple |
| CALIDAD | 🟣 Morado | En control de calidad |
| PARCIAL (REM) | 🔷 Azul | Parcialmente listo |
| LISTO | 🟢 Verde | Completado |
| FACTURADO | ⚪ Gris | Ya facturado |
| PARO/MAT | 🔴 Rojo | Detenido (alerta) |

## 🔧 Tecnologías Utilizadas

### Frontend
- **HTML5 + CSS3**: Estructura y estilos
- **Vanilla JavaScript**: Lógica sin frameworks
- **Tailwind CSS**: Utilidades CSS
- **Font Awesome 6**: Iconografía

### Backend
- **Firebase Firestore**: Base de datos NoSQL en tiempo real
- **Firebase SDK 10.7.1**: Cliente JavaScript

### Arquitectura
- **Patrón modular**: 14 módulos JavaScript independientes
- **Separación de responsabilidades**: CSS dividido en 5 archivos temáticos
- **Event-driven**: Sistema de eventos para comunicación entre módulos

## 📦 Migración de Datos

Si ya tenías datos guardados en localStorage:

1. Abre la aplicación después de configurar Firebase
2. Verás un modal automático preguntando si deseas migrar
3. Click en **"Migrar"** para transferir los datos a Firebase
4. ✅ Tus datos ahora están en la nube

También puedes:
- Exportar desde el dashboard antiguo (`dashboard.html`)
- Importar en el nuevo usando el botón "Importar"

## 🔄 Sincronización en Tiempo Real

El dashboard utiliza Firebase Firestore con listeners en tiempo real:

- ✅ **Múltiples dispositivos**: Cambios visibles instantáneamente
- ✅ **Offline-first**: Funciona sin internet, sincroniza al reconectar
- ✅ **Persistencia local**: Datos guardados en caché del navegador
- ✅ **Actualizaciones automáticas**: Sin necesidad de refrescar

## 💾 Respaldo y Exportación

### Auto-exportación
- Se ejecuta cada **3 minutos** automáticamente
- Genera archivo JSON con timestamp
- Notificación visual al exportar

### Exportación manual
1. Activa modo edición
2. Click en **"Exportar"**
3. Descarga archivo `smv-ordenes-YYYY-MM-DD.json`

### Importación
1. Activa modo edición
2. Click en **"Importar"**
3. Selecciona archivo JSON
4. Confirma reemplazo de datos

## 🔒 Seguridad

- **Reglas de Firestore**: Configurables en Firebase Console
- **Sin autenticación**: Por defecto (puede agregarse fácilmente)
- **API Keys públicas**: Normal en apps Firebase (ver documentación oficial)
- **Validación de datos**: En cliente y servidor

## 🎯 Mejores Prácticas

### Desarrollo
- ✅ Código modular y comentado con JSDoc
- ✅ Separación de responsabilidades (CSS/JS)
- ✅ Sin librerías innecesarias
- ✅ Nombres descriptivos de variables y funciones
- ✅ Error handling robusto

### Performance
- ✅ Event delegation para mejor rendimiento
- ✅ Batch updates en Firestore
- ✅ Throttling en auto-exportación
- ✅ Lazy loading de imágenes

## 🐛 Solución de Problemas

### Firebase no conecta

```
❌ Firebase no está configurado
```

**Solución**: 
1. Verifica `js/firebase-config.js`
2. Asegúrate de haber copiado las credenciales correctas
3. Consulta `FIREBASE_SETUP.md`

### Permisos denegados

```
❌ Error: Missing or insufficient permissions
```

**Solución**:
1. Ve a Firebase Console → Firestore Database → Reglas
2. Configura las reglas según `FIREBASE_SETUP.md` Paso 5
3. Publica las reglas

### Las órdenes no se sincronizan

**Solución**:
1. Verifica conexión a internet
2. Abre consola del navegador (F12) y busca errores
3. Refresca la página (F5)
4. Verifica que Firebase esté inicializado

## 📊 Límites de Firebase (Plan Gratuito)

| Recurso | Límite | Suficiente para |
|---------|--------|-----------------|
| Lecturas | 50,000/día | ✅ Miles de refreshes |
| Escrituras | 20,000/día | ✅ Miles de ediciones |
| Almacenamiento | 1 GB | ✅ Millones de órdenes |
| Transferencia | 10 GB/mes | ✅ Uso normal |

Para este dashboard, el plan gratuito es **más que suficiente**.

## 🔄 Sincronización Git (Opcional)

El proyecto incluye un script `sync.ps1` para sincronizar con GitHub.

### Configurar GitHub

```powershell
# Primera vez
git remote add origin https://github.com/TU_USUARIO/tv-dashboard.git
git branch -M main
git push -u origin main

# Uso diario
.\sync.ps1 "Descripción de cambios"
```

Ver instrucciones detalladas en el README original.

## 🎓 Estructura de Módulos

### Dependencias entre módulos

```
firebase-config.js → firebase.js
                       ↓
config.js + state.js + formatters.js
                       ↓
                  storage.js
                       ↓
    ┌──────────────────┴──────────────────┐
    ↓                  ↓                   ↓
modal.js         dragdrop.js         ui-render.js
    ↓                  ↓                   ↓
    └──────────────────┴──────────────────┘
                       ↓
              order-operations.js
                       ↓
              export-import.js
                       ↓
                   clock.js
                       ↓
                   main.js
```

## 📝 Changelog

### v4.0 (Actual) - Arquitectura Modular
- ✨ Refactorización completa a arquitectura modular
- 🔥 Integración Firebase Firestore
- 🎨 CSS separado en 5 archivos temáticos
- 📦 14 módulos JavaScript independientes
- 🔄 Sincronización en tiempo real
- 💾 Sistema de migración desde localStorage
- 📱 Mejoras en UI/UX

### v3.1 (Legacy) - Monolito
- dashboard.html de 1360 líneas
- localStorage como única persistencia
- Todo el código en un archivo

## 🤝 Contribuir

El código está organizado para facilitar contribuciones:

1. Cada módulo tiene una responsabilidad única
2. Funciones documentadas con JSDoc
3. Nombres descriptivos y convenciones claras
4. CSS organizado por categorías

## 📄 Licencia

Proyecto interno de SMV Maquinados.

## 🆘 Soporte

Para problemas técnicos:
1. Revisa la consola del navegador (F12)
2. Consulta `FIREBASE_SETUP.md`
3. Verifica que todos los archivos estén presentes
4. Confirma que Firebase esté configurado correctamente

---

**Desarrollado con ❤️ para SMV Maquinados**

v4.0 - Arquitectura Modular con Firebase Firestore
