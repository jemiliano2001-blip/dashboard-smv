# 🔥 Configuración de Firebase Firestore

Esta guía te ayudará a configurar Firebase Firestore para el Dashboard SMV.

## 📋 Requisitos Previos

- Cuenta de Google
- Navegador web moderno (Chrome, Firefox, Edge)

## 🚀 Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Add project"**
3. Ingresa un nombre para tu proyecto (ejemplo: `smv-dashboard`)
4. Acepta los términos y continúa
5. *Opcional:* Puedes deshabilitar Google Analytics si no lo necesitas
6. Haz clic en **"Crear proyecto"**

## 🌐 Paso 2: Registrar Aplicación Web

1. En el panel del proyecto, haz clic en el ícono **</>** (Web)
2. Ingresa un apodo para tu app (ejemplo: `Dashboard SMV`)
3. **NO** marques "Firebase Hosting" (a menos que lo necesites)
4. Haz clic en **"Registrar app"**

## 🔑 Paso 3: Copiar Credenciales

Verás un código similar a este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**Copia estos valores** y pégalos en el archivo `js/firebase-config.js` de tu proyecto.

### Ejemplo de firebase-config.js configurado:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAbc123def456ghi789jkl012mno345pqr",
    authDomain: "smv-dashboard.firebaseapp.com",
    projectId: "smv-dashboard",
    storageBucket: "smv-dashboard.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789"
};
```

## 🗄️ Paso 4: Habilitar Firestore Database

1. En el menú lateral de Firebase Console, busca **"Firestore Database"**
2. Haz clic en **"Crear base de datos"** o **"Create database"**
3. Selecciona **"Iniciar en modo de producción"** (Production mode)
4. Elige una ubicación cercana a ti (ejemplo: `us-central` para América)
5. Haz clic en **"Habilitar"**

## 🔒 Paso 5: Configurar Reglas de Seguridad

⚠️ **IMPORTANTE**: Por defecto, Firestore bloquea todas las lecturas y escrituras. Debes configurar las reglas de seguridad.

### Para desarrollo/testing (SIN autenticación):

1. Ve a la pestaña **"Reglas"** en Firestore Database
2. Reemplaza las reglas con esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Haz clic en **"Publicar"**

> ⚠️ **ADVERTENCIA**: Estas reglas permiten acceso total a cualquiera. Solo úsalas para desarrollo.

### Para producción (CON autenticación):

Si en el futuro necesitas autenticación, usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ✅ Paso 6: Verificar Configuración

1. Abre el archivo `index.html` en tu navegador
2. Abre la consola de desarrollador (F12)
3. Deberías ver estos mensajes:

```
✅ Firebase inicializado correctamente
✅ Persistencia offline habilitada
📦 Órdenes sincronizadas: 0
✅ Aplicación inicializada correctamente
```

Si ves errores de permisos, verifica el **Paso 5** (Reglas de seguridad).

## 📦 Migración de Datos Existentes

Si ya tenías órdenes guardadas en localStorage:

1. Abre la aplicación
2. Verás un modal preguntando: **"¿Migrar datos?"**
3. Haz clic en **"Migrar"**
4. Tus órdenes se copiarán automáticamente a Firebase

También puedes:
- **Exportar** tus datos desde el botón "Exportar" (en modo edición)
- **Importar** usando el botón "Importar" y seleccionando el archivo JSON

## 🔧 Solución de Problemas

### Error: "Firebase no está configurado"

- Verifica que copiaste correctamente las credenciales en `js/firebase-config.js`
- Asegúrate de NO dejar los valores por defecto (`TU_API_KEY_AQUI`)

### Error: "Missing or insufficient permissions"

- Ve al **Paso 5** y configura las reglas de seguridad
- Asegúrate de publicar las reglas después de editarlas

### Error: "quota exceeded"

- Firebase tiene límites en el plan gratuito:
  - 50,000 lecturas/día
  - 20,000 escrituras/día
  - 1 GB de almacenamiento
- Para este dashboard, estos límites son más que suficientes

### Las órdenes no se sincronizan en tiempo real

- Verifica tu conexión a internet
- Revisa la consola del navegador (F12) en busca de errores
- Asegúrate de que Firebase esté inicializado correctamente

## 📊 Monitoreo y Uso

Para ver tus datos en Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Verás la colección `orders` con todos tus documentos

Puedes:
- Ver todas las órdenes
- Editar/eliminar manualmente desde la consola
- Ver estadísticas de uso

## 🔐 Seguridad Adicional (Opcional)

Si quieres restringir el acceso solo a tu dominio:

1. En Firebase Console, ve a **Configuración del proyecto** (⚙️)
2. Busca **"Restricciones de API key"**
3. Agrega tu dominio a la lista de dominios permitidos

## 💡 Consejos

- **Backup automático**: La app exporta automáticamente cada 3 minutos
- **Offline first**: Firebase guarda datos localmente si pierdes conexión
- **Tiempo real**: Los cambios se sincronizan automáticamente entre dispositivos
- **Gratis**: El plan gratuito de Firebase es suficiente para este uso

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) en busca de mensajes de error
2. Verifica que Firebase esté habilitado en tu proyecto
3. Confirma que las reglas de seguridad estén configuradas correctamente

---

**¡Listo!** Tu dashboard ahora está conectado a Firebase Firestore y tus datos se guardarán en la nube. 🎉
