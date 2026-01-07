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
async function migrateOrdersToMultiCompany(silent = false) {
    console.log('🔄 Iniciando migración de datos...');
    
    let migratedCount = 0;
    const defaultCompany = 'SUPRAJIT';
    
    // Verificar si hay órdenes sin company
    if (!hasOrdersWithoutCompany()) {
        console.log('✅ No se requiere migración, todas las órdenes tienen compañía asignada');
        return;
    }
    
    // Protección anti-loop: si ya migramos recientemente, ignorar
    const lastMigration = parseInt(sessionStorage.getItem('last_migration_ts') || '0');
    const now = Date.now();
    if (now - lastMigration < 10000) {
        console.log('⏭️ Saltando migración para evitar loops (ya ejecutada hace menos de 10s)');
        return;
    }
    sessionStorage.setItem('last_migration_ts', now.toString());
    
    // Actualizar órdenes sin company - SOLO actualizar las que tengan ID
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
    
    // Actualizar estado local
    state.orders = updatedOrders;
    
    // Guardar en Firestore solo si hubo cambios Y solo las órdenes con ID
    if (migratedCount > 0) {
        try {
            const ordersWithIds = updatedOrders.filter(order => order.id);
            
            if (ordersWithIds.length === 0) {
                console.log('⚠️ No hay órdenes con ID para migrar en Firebase');
                return;
            }
            
            // Batch update eficiente solo de campo company
            if (typeof batchUpdateOrders === 'function') {
                await batchUpdateOrders(ordersWithIds);
            }
            
            console.log(`✅ Migración completada: ${migratedCount} órdenes actualizadas con compañía '${defaultCompany}'`);
            
            if (!silent && typeof showNotification === 'function') {
                showNotification({
                    type: 'success',
                    message: `${migratedCount} órdenes actualizadas con compañía por defecto`
                });
            }
        } catch (error) {
            console.error('❌ Error durante la migración:', error);
        }
    }
}

/**
 * Verifica y ejecuta la migración si es necesario
 * Llamar durante la inicialización de la app
 * @param {boolean} silent - Si es true, no muestra notificaciones en pantalla
 * @returns {Promise<void>}
 */
async function checkAndMigrate(silent = false) {
    if (state.orders.length === 0) {
        console.log('ℹ️ No hay órdenes para migrar');
        return;
    }
    
    if (hasOrdersWithoutCompany()) {
        console.log('⚠️ Se detectaron órdenes sin compañía asignada');
        await migrateOrdersToMultiCompany(silent);
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
