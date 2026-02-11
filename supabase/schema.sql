-- TV Dashboard Visual Factory - Schema
-- Tabla principal para órdenes de trabajo

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  po_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity_total INTEGER NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  quantity_completed INTEGER NOT NULL DEFAULT 0 CHECK (quantity_completed >= 0),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'production', 'quality', 'hold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_work_orders_company_name ON work_orders(company_name);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_company_priority ON work_orders(company_name, priority DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para la tabla (ignora error si ya existe)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE work_orders IS 'Órdenes de trabajo para el dashboard de TV Visual Factory';
COMMENT ON COLUMN work_orders.company_name IS 'Nombre de la compañía que posee la orden';
COMMENT ON COLUMN work_orders.po_number IS 'Número de orden de compra (Purchase Order)';
COMMENT ON COLUMN work_orders.part_name IS 'Nombre de la pieza/parte a manufacturar';
COMMENT ON COLUMN work_orders.quantity_total IS 'Cantidad total a producir';
COMMENT ON COLUMN work_orders.quantity_completed IS 'Cantidad completada hasta el momento';
COMMENT ON COLUMN work_orders.priority IS 'Prioridad: low, normal, high, critical';
COMMENT ON COLUMN work_orders.status IS 'Estado actual: scheduled, production, quality, hold';

-- Tabla de historial de cambios para auditoría
CREATE TABLE IF NOT EXISTS work_orders_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas de historial
CREATE INDEX IF NOT EXISTS idx_work_orders_history_work_order_id ON work_orders_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_history_created_at ON work_orders_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_history_change_type ON work_orders_history(change_type);

-- Función para registrar cambios en el historial
CREATE OR REPLACE FUNCTION log_work_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO work_orders_history (work_order_id, changed_field, new_value, change_type)
    VALUES (NEW.id, 'created', 'Order created', 'create');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'company_name', OLD.company_name, NEW.company_name, 'update');
    END IF;
    IF OLD.po_number IS DISTINCT FROM NEW.po_number THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'po_number', OLD.po_number, NEW.po_number, 'update');
    END IF;
    IF OLD.part_name IS DISTINCT FROM NEW.part_name THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'part_name', OLD.part_name, NEW.part_name, 'update');
    END IF;
    IF OLD.quantity_total IS DISTINCT FROM NEW.quantity_total THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'quantity_total', OLD.quantity_total::TEXT, NEW.quantity_total::TEXT, 'update');
    END IF;
    IF OLD.quantity_completed IS DISTINCT FROM NEW.quantity_completed THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'quantity_completed', OLD.quantity_completed::TEXT, NEW.quantity_completed::TEXT, 'update');
    END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, 'update');
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO work_orders_history (work_order_id, changed_field, old_value, new_value, change_type)
      VALUES (NEW.id, 'status', OLD.status, NEW.status, 'update');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO work_orders_history (work_order_id, changed_field, old_value, change_type)
    VALUES (OLD.id, 'deleted', 'Order deleted', 'delete');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT y UPDATE (AFTER: la fila ya existe)
DROP TRIGGER IF EXISTS work_orders_history_trigger ON work_orders;
CREATE TRIGGER work_orders_history_trigger
  AFTER INSERT OR UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_work_order_changes();

-- Trigger para DELETE (BEFORE: la fila aún existe para satisfacer el FK)
DROP TRIGGER IF EXISTS work_orders_history_delete_trigger ON work_orders;
CREATE TRIGGER work_orders_history_delete_trigger
  BEFORE DELETE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_work_order_changes();

-- Habilitar Realtime para la tabla de historial (ignora error si ya existe)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE work_orders_history;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comentarios para documentación del historial
COMMENT ON TABLE work_orders_history IS 'Historial de cambios de órdenes de trabajo para auditoría';
COMMENT ON COLUMN work_orders_history.work_order_id IS 'ID de la orden de trabajo modificada';
COMMENT ON COLUMN work_orders_history.changed_field IS 'Campo que fue modificado';
COMMENT ON COLUMN work_orders_history.old_value IS 'Valor anterior del campo';
COMMENT ON COLUMN work_orders_history.new_value IS 'Nuevo valor del campo';
COMMENT ON COLUMN work_orders_history.changed_by IS 'Usuario que realizó el cambio (opcional)';
COMMENT ON COLUMN work_orders_history.change_type IS 'Tipo de cambio: create, update, delete';

-- =============================================================================
-- Row Level Security (RLS)
-- - anon: solo lectura (SELECT) — suficiente para el TV Dashboard público
-- - authenticated: lectura + escritura (SELECT, INSERT, UPDATE, DELETE)
-- =============================================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders_history ENABLE ROW LEVEL SECURITY;

-- ---- work_orders ----

-- Anon: solo lectura (TV Dashboard solo necesita SELECT)
DROP POLICY IF EXISTS "work_orders_anon_all" ON work_orders;
DROP POLICY IF EXISTS "work_orders_anon_select" ON work_orders;
CREATE POLICY "work_orders_anon_select"
  ON work_orders FOR SELECT
  TO anon
  USING (true);

-- Authenticated: acceso completo para operaciones CRUD del Admin Panel
DROP POLICY IF EXISTS "work_orders_authenticated_all" ON work_orders;
CREATE POLICY "work_orders_authenticated_all"
  ON work_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---- work_orders_history ----

-- Anon: solo lectura del historial
DROP POLICY IF EXISTS "work_orders_history_anon_all" ON work_orders_history;
DROP POLICY IF EXISTS "work_orders_history_anon_select" ON work_orders_history;
CREATE POLICY "work_orders_history_anon_select"
  ON work_orders_history FOR SELECT
  TO anon
  USING (true);

-- Authenticated: acceso completo al historial
DROP POLICY IF EXISTS "work_orders_history_authenticated_all" ON work_orders_history;
CREATE POLICY "work_orders_history_authenticated_all"
  ON work_orders_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Hosting estático (Opción A): crear un bucket público en Dashboard → Storage
-- (ej. nombre "web") y subir el contenido de dist/ con: npm run deploy:storage
-- Ver README sección "Hosting (despliegue)".
-- =============================================================================
