/**
 * Data Migration Module
 * Maneja la migración de datos legacy a la nueva estructura
 */

/**
 * Verifica si hay órdenes sin el campo company
 * @returns {boolean}
 */
function hasOrdersWithoutCompany() {
    return state.orders.some(order => !order.company || order.company === '');
}

/**
 * Migra órdenes legacy agregando el campo company
 * @returns {Promise<void>}
 */
async function migrateOrdersToMultiCompany() {
    console.log('🔄 Iniciando migración de datos...');
    
    let migratedCount = 0;
    const defaultCompany = 'SUPRAJIT';
    
    // Verificar si hay órdenes sin company
    if (!hasOrdersWithoutCompany()) {
        console.log('✅ No se requiere migración, todas las órdenes tienen compañía asignada');
        return;
    }
    
    // Actualizar órdenes sin company
    const updatedOrders = state.orders.map(order => {
        if (!order.company || order.company === '') {
            migratedCount++;
            return {
                ...order,
                company: defaultCompany
            };
        }
        return order;
    });
    
    // Actualizar estado
    state.orders = updatedOrders;
    
    // Guardar en Firestore
    try {
        await saveAllOrders(state.orders);
        console.log(`✅ Migración completada: ${migratedCount} órdenes actualizadas con compañía '${defaultCompany}'`);
        
        // Mostrar notificación si hay notificaciones configuradas
        if (typeof showNotification === 'function') {
            showNotification({
                type: 'success',
                message: `${migratedCount} órdenes actualizadas con compañía por defecto`
            });
        }
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

/**
 * Verifica y ejecuta la migración si es necesario
 * Llamar durante la inicialización de la app
 * @returns {Promise<void>}
 */
async function checkAndMigrate() {
    if (state.orders.length === 0) {
        console.log('ℹ️ No hay órdenes para migrar');
        return;
    }
    
    if (hasOrdersWithoutCompany()) {
        console.log('⚠️ Se detectaron órdenes sin compañía asignada');
        await migrateOrdersToMultiCompany();
    } else {
        console.log('✅ Todas las órdenes tienen compañía asignada');
    }
}

/**
 * Normaliza el campo company en una orden individual
 * @param {Object} order - Orden a normalizar
 * @returns {Object} Orden normalizada
 */
function normalizeOrderCompany(order) {
    if (!order.company || order.company === '') {
        return {
            ...order,
            company: 'SUPRAJIT'
        };
    }
    return order;
}
