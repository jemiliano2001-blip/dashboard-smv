# Guía de Sincronización Odoo -> Dashboard TV

Este script conecta tu Odoo con el Dashboard en tiempo real, importando automáticamente las nuevas órdenes de venta.

## Prerrequisitos

1.  **Python 3.x instalado**
    *   Descargar de: [python.org](https://www.python.org/downloads/)
    *   Al instalar, asegúrate de marcar la casilla "Add Python to PATH".

2.  **Credenciales de Firebase (Archivo JSON)**
    *   Ve a la consola de Firebase: [https://console.firebase.google.com/](https://console.firebase.google.com/)
    *   Selecciona tu proyecto "smv-dashboard".
    *   Ve a **Configuración del proyecto** (rueda dentada) -> **Cuentas de servicio**.
    *   Haz clic en **Generar nueva clave privada**.
    *   Se descargará un archivo JSON. **Renómbralo a `serviceAccountKey.json`** y colócalo en esta misma carpeta (donde está `odoo_sync.py`).

## Instalación

1.  Abre una terminal (PowerShell o CMD) en esta carpeta.
2.  Instala las librerías necesarias ejecutando:
    ```bash
    pip install -r requirements.txt
    ```

## Configuración

1.  Abre el archivo `sync_config.py` con un editor de texto (Notepad, VS Code).
2.  Edita la sección **Credenciales de Odoo** con tus datos reales:
    ```python
    ODOO_URL = "https://tu-empresa.odoo.com"
    ODOO_DB = "nombre_base_datos"
    ODOO_USERNAME = "tu@email.com"
    ODOO_PASSWORD = "tu_password_o_api_key"
    ```
    *Tip: Para mayor seguridad, usa una API Key de Odoo en lugar de tu contraseña personal si tu versión lo soporta.*

## Ejecución

Para iniciar el puente de sincronización, ejecuta:

```bash
python odoo_sync.py
```

Verás mensajes como:
*   `🚀 Iniciando servicio...`
*   `✅ Conexiones establecidas`
*   `🔄 Buscando nuevas órdenes...`
*   `✅ Nueva orden importada: SO12345`

### Ejecutar en segundo plano (Opcional)
Si quieres que se ejecute siempre en esa PC sin tener la ventana abierta, puedes usar el Programador de Tareas de Windows para que inicie `odoo_sync.py` al arrancar el equipo.

## Preguntas Frecuentes

*   **¿Cada cuánto se actualiza?**
    Por defecto cada 60 segundos. Puedes cambiarlo en `sync_config.py` variable `SYNC_INTERVAL`.
*   **¿Duplicará mis órdenes?**
    No. El script verifica si el número de PO (ej: SO20761) ya existe en el Dashboard antes de importarlo.
*   **¿Qué órdenes importa?**
    Por defecto, busca órdenes creadas en las últimas 24 horas que estén en estado 'Venta' (Confirmadas) o 'Realizado'.
