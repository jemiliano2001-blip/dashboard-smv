# Configuracion de Sincronizacion Odoo -> Firebase

# 1. Credenciales de Odoo
ODOO_URL = "https://tu-odoo-url.com"  # URL de tu Odoo
ODOO_DB = "nombre_db"               # Nombre de la base de datos
ODOO_USERNAME = "usuario@email.com"                     # Usuario (email)
ODOO_PASSWORD = "tu_contraseña_o_api_key"        # Contraseña o API Key

# 2. Credenciales de Firebase
# Ruta al archivo JSON de credenciales de servicio de Firebase
# Descargalo de: Configuración del Proyecto -> Cuentas de servicio -> Generar nueva clave privada
FIREBASE_CREDENTIALS_PATH = "serviceAccountKey.json"

# 3. Configuracion de Sincronizacion
SYNC_INTERVAL = 60  # Segundos entre cada chequeo
STATUS_DEFAULT = "process"  # Estado inicial en el dashboard (process = MAQUINADO)
COMPANY_DEFAULT = "CLIENTE_DEFAULT" # Compañia por defecto si no se encuentra cliente

# Mapeo de Estatus Odoo -> Dashboard (Opcional, si quieres mapear estados de Odoo)
# Claves son estados de Odoo, Valores son estados del Dashboard
ODOO_STATUS_MAP = {
    'sale': 'process',      # Pedido de venta -> Maquinado
    'done': 'done',         # Bloqueado/Realizado -> Listo
    'cancel': 'hold',       # Cancelado -> Paro
    'draft': 'process',     # Presupuesto -> Maquinado (si decides importarlos)
}
