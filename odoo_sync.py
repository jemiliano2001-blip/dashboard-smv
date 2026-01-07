import time
import datetime
import xmlrpc.client
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import sync_config as config

# --- SETUP FIREBASE ---
def init_firebase():
    try:
        cred = credentials.Certificate(config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"❌ Error inicializando Firebase: {e}")
        print(f"Asegurate de tener el archivo {config.FIREBASE_CREDENTIALS_PATH} en la misma carpeta.")
        return None

# --- SETUP ODOO ---
def init_odoo():
    try:
        common = xmlrpc.client.ServerProxy(f'{config.ODOO_URL}/xmlrpc/2/common')
        uid = common.authenticate(config.ODOO_DB, config.ODOO_USERNAME, config.ODOO_PASSWORD, {})
        models = xmlrpc.client.ServerProxy(f'{config.ODOO_URL}/xmlrpc/2/object')
        return uid, models
    except Exception as e:
        print(f"❌ Error conectando a Odoo: {e}")
        return None, None

# --- MAIN LOGIC ---
def sync_cycle(db, uid, models):
    print(f"🔄 Buscando nuevas órdenes en Odoo... ({datetime.datetime.now().strftime('%H:%M:%S')})")
    
    try:
        # 1. Buscar órdenes recientes en Odoo (últimas 24 horas para ser eficiente)
        # Ajusta el dominio según tus necesidades. Aquí buscamos órdenes de venta confirmadas.
        # Puedes quitar el filtro de fecha si quieres escanear todo siempre (no recomendado si tienes muchas)
        today_start = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
        
        domain = [
            ['create_date', '>=', today_start],
            ['state', 'in', ['sale', 'done']] # Solo órdenes confirmadas
        ]
        
        # Campos a leer
        fields = ['name', 'partner_id', 'date_order', 'order_line', 'state']
        
        order_ids = models.execute_kw(config.ODOO_DB, uid, config.ODOO_PASSWORD,
            'sale.order', 'search', [domain])
            
        if not order_ids:
            print("   No se encontraron órdenes recientes.")
            return

        orders = models.execute_kw(config.ODOO_DB, uid, config.ODOO_PASSWORD,
            'sale.order', 'read', [order_ids], {'fields': fields})
            
        print(f"   Encontradas {len(orders)} órdenes recientes en Odoo.")

        # 2. Procesar cada orden
        new_count = 0
        for odoo_order in orders:
            po_number = odoo_order.get('name', 'UNKNOWN')
            
            # Verificar si ya existe en Firebase
            # Consultamos por el campo 'po'
            existing_docs = db.collection('orders').where('po', '==', po_number).stream()
            if any(existing_docs):
                # Ya existe, saltar (o actualizar si quisieras)
                continue

            # 3. Preparar datos para Firebase
            # Obtener detalles de productos (partes)
            line_ids = odoo_order.get('order_line', [])
            parts_str = ""
            total_qty = 0
            
            if line_ids:
                # Leer líneas de orden para obtener productos y cantidades
                lines = models.execute_kw(config.ODOO_DB, uid, config.ODOO_PASSWORD,
                    'sale.order.line', 'read', [line_ids], {'fields': ['product_id', 'product_uom_qty', 'name']})
                
                part_names = []
                for line in lines:
                    # product_id viene como [id, "Nombre Producto"]
                    p_name = line.get('product_id', [0, ''])[1] if line.get('product_id') else line.get('name', '')
                    # Limpiar nombre si es necesario (ej: [REF] Nombre)
                    if ']' in p_name:
                        p_name = p_name.split(']')[1].strip()
                    
                    part_names.append(p_name)
                    total_qty += line.get('product_uom_qty', 0)
                
                parts_str = ", ".join(part_names)
                # Truncar si es muy largo
                if len(parts_str) > 50:
                    parts_str = parts_str[:47] + "..."

            # Mapear Cliente
            partner = odoo_order.get('partner_id', [0, config.COMPANY_DEFAULT])
            company_name = partner[1] if partner else config.COMPANY_DEFAULT
            
            # Formatear fecha
            date_str = odoo_order.get('date_order', '')
            formatted_date = ''
            if date_str:
                # Odoo retorna YYYY-MM-DD HH:MM:SS
                try:
                    dt = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    # Formato deseado: 01/ENE
                    months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
                    formatted_date = f"{dt.day:02d}/{months[dt.month-1]}"
                except:
                    formatted_date = date_str[:10]

            # Crear objeto orden
            new_order = {
                'po': po_number,
                'part': parts_str or "Sin descripción",
                'qty': str(int(total_qty)), # El dashboard usa strings para qty a veces
                'status': config.ODOO_STATUS_MAP.get(odoo_order.get('state'), config.STATUS_DEFAULT),
                'date': formatted_date,
                'company': company_name,
                'notes': f"Importado de Odoo {datetime.datetime.now().strftime('%d/%m %H:%M')}",
                'order': 0, # Se irá al principio o se reordenará
                'updatedAt': firestore.SERVER_TIMESTAMP
            }

            # 4. Guardar en Firebase
            db.collection('orders').add(new_order)
            print(f"   ✅ Nueva orden importada: {po_number} - {company_name}")
            new_count += 1

        if new_count == 0:
            print("   Sin órdenes nuevas para importar.")

    except Exception as e:
        print(f"❌ Error en ciclo de sincronización: {e}")

def main():
    print("🚀 Iniciando servicio de sincronización Odoo -> Dashboard")
    
    # Inicializar conexiones
    db = init_firebase()
    if not db:
        return

    uid, models = init_odoo()
    if not uid:
        return

    print("✅ Conexiones establecidas. Escuchando...")

    while True:
        sync_cycle(db, uid, models)
        time.sleep(config.SYNC_INTERVAL)

if __name__ == "__main__":
    main()
