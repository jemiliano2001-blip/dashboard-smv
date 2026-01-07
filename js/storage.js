/**
 * Storage Service - Persistencia con Firebase Firestore
 * Maneja la carga y guardado de datos en la nube
 */

/**
 * Carga las órdenes desde localStorage como respaldo
 * @returns {Array} Array de órdenes
 */
function loadOrdersFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('smv_orders_backup');
        if (!savedData) {
            // Intentar cargar desde clave legacy
            const legacyData = localStorage.getItem('smv_dash_v3_1');
            if (legacyData) {
                const orders = JSON.parse(legacyData);
                // Guardar en nueva clave
                localStorage.setItem('smv_orders_backup', legacyData);
                return orders;
            }
            return [];
        }
        return JSON.parse(savedData);
    } catch (error) {
        console.error('❌ Error al cargar desde localStorage:', error);
        return [];
    }
}

/**
 * Guarda las órdenes en localStorage como respaldo
 * @param {Array} orders - Órdenes a guardar
 */
function saveOrdersToLocalStorage(orders) {
    try {
        localStorage.setItem('smv_orders_backup', JSON.stringify(orders));
    } catch (error) {
        console.error('❌ Error al guardar en localStorage:', error);
    }
}

/**
 * Carga las órdenes desde Firestore con suscripción en tiempo real
 * @param {Function} callback - Función a llamar cuando se actualicen las órdenes
 * @returns {Promise<Function>} - Función para cancelar la suscripción
 */
async function loadOrdersFromFirestore(callback) {
    try {
        const initialized = await initializeFirebase();
        
        if (!initialized) {
            console.warn('⚠️ Firebase no disponible, usando localStorage');
            const localOrders = loadOrdersFromLocalStorage();
            if (localOrders.length > 0) {
                callback(localOrders);
            } else {
                callback(generateSampleData());
            }
            return () => {};
        }

        // Suscribirse a cambios en tiempo real
        const unsubscribe = subscribeToOrders((firestoreOrders) => {
            // Normalizar POs al cargar
            const normalizedOrders = firestoreOrders.map(order => ({
                ...order,
                po: order.po ? normalizePO(order.po) : ''
            }));
            
            // Guardar respaldo en localStorage
            saveOrdersToLocalStorage(normalizedOrders);
            
            callback(normalizedOrders);
        });

        return unsubscribe;
    } catch (error) {
        console.error('❌ Error al cargar órdenes:', error);
        
        // Verificar si es error de cuota
        const isQuotaError = error.message && (
            error.message.includes('quota') || 
            error.message.includes('Quota') ||
            error.code === 'resource-exhausted' ||
            error.code === 8
        );
        
        if (isQuotaError) {
            console.warn('⚠️ Cuota de Firebase excedida, usando localStorage');
            if (typeof showFirebaseError === 'function') {
                showFirebaseError('⚠️ Cuota de Firebase excedida. Usando datos locales. Los cambios se guardarán localmente.', true);
            }
        }
        
        // Cargar desde localStorage como respaldo
        const localOrders = loadOrdersFromLocalStorage();
        if (localOrders.length > 0) {
            callback(localOrders);
        } else {
            callback(generateSampleData());
        }
        return () => {};
    }
}

/**
 * Guarda una orden individual en Firestore
 * @param {Object} order - Orden a guardar
 * @param {number} index - Índice de la orden
 * @returns {Promise<string>} - ID del documento guardado
 */
async function saveOrderToStorage(order, index) {
    // Siempre guardar en localStorage como respaldo
    saveOrdersToLocalStorage(state.orders);
    
    if (!isFirebaseConnected()) {
        console.warn('⚠️ Firebase no disponible, guardando solo en localStorage');
        return null;
    }

    try {
        // Asegurar que el PO esté normalizado antes de guardar
        const orderToSave = {
            ...order,
            po: order.po ? normalizePO(order.po) : ''
        };
        
        const docId = await saveOrderToFirestore(orderToSave, index);
        return docId;
    } catch (error) {
        console.error('❌ Error al guardar orden en Firebase:', error);
        // No lanzar error, ya se guardó en localStorage
        return null;
    }
}

/**
 * Guarda todas las órdenes en Firestore (batch update)
 * @param {Array} orders - Array de órdenes a guardar
 * @returns {Promise<void>}
 */
async function saveAllOrders(orders) {
    // Siempre guardar en localStorage como respaldo
    saveOrdersToLocalStorage(orders);
    
    if (!isFirebaseConnected()) {
        console.warn('⚠️ Firebase no disponible, guardando solo en localStorage');
        return;
    }

    try {
        // Normalizar POs antes de guardar
        const normalizedOrders = orders.map(order => ({
            ...order,
            po: order.po ? normalizePO(order.po) : ''
        }));

        await batchUpdateOrders(normalizedOrders);
        console.log('✅ Todas las órdenes guardadas en Firebase y localStorage');
    } catch (error) {
        console.error('❌ Error al guardar todas las órdenes en Firebase:', error);
        // No lanzar error, ya se guardó en localStorage
        console.log('✅ Órdenes guardadas en localStorage como respaldo');
    }
}

/**
 * Elimina una orden de Firestore
 * @param {string} orderId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
async function deleteOrderFromStorage(orderId) {
    if (!isFirebaseConnected()) {
        console.warn('⚠️ Firebase no disponible');
        return;
    }

    try {
        await deleteOrderFromFirestore(orderId);
    } catch (error) {
        console.error('❌ Error al eliminar orden:', error);
        throw error;
    }
}

/**
 * Carga la preferencia de densidad desde localStorage (preferencia local)
 * @returns {boolean} - true si el modo compacto está activado
 */
function loadDensityPreference() {
    const saved = localStorage.getItem('smv_density_compact');
    return saved === 'true';
}

/**
 * Guarda la preferencia de densidad en localStorage (preferencia local)
 * @param {boolean} isCompact - true para modo compacto
 */
function saveDensityPreference(isCompact) {
    localStorage.setItem('smv_density_compact', isCompact.toString());
}

/**
 * Migra datos desde localStorage a Firestore
 * @returns {Promise<number>} - Número de órdenes migradas
 */
async function migrateFromLocalStorage() {
    if (!isFirebaseConnected()) {
        throw new Error('Firebase no está conectado');
    }

    try {
        // Intentar cargar datos de la clave legacy
        const savedData = localStorage.getItem('smv_dash_v3_1');
        
        if (!savedData) {
            console.log('ℹ️ No hay datos en localStorage para migrar');
            return 0;
        }

        const orders = JSON.parse(savedData);
        
        if (!Array.isArray(orders) || orders.length === 0) {
            console.log('ℹ️ No hay órdenes válidas para migrar');
            return 0;
        }

        // Importar a Firestore
        const count = await importOrdersToFirestore(orders);
        
        // Opcional: Limpiar localStorage después de migración exitosa
        // localStorage.removeItem('smv_dash_v3_1');
        
        console.log(`✅ ${count} órdenes migradas de localStorage a Firestore`);
        return count;
    } catch (error) {
        console.error('❌ Error al migrar datos:', error);
        throw error;
    }
}

/**
 * Verifica si hay datos en localStorage que puedan migrarse
 * @returns {boolean}
 */
function hasLocalStorageData() {
    const savedData = localStorage.getItem('smv_dash_v3_1');
    if (!savedData) return false;
    
    try {
        const orders = JSON.parse(savedData);
        return Array.isArray(orders) && orders.length > 0;
    } catch {
        return false;
    }
}

/**
 * Exporta datos actuales como JSON para backup
 * @param {Array} orders - Órdenes a exportar
 * @returns {string} - JSON string
 */
function exportToJSON(orders) {
    return JSON.stringify(orders, null, 2);
}

/**
 * Importa datos desde JSON
 * @param {string} jsonString - JSON string con las órdenes
 * @returns {Array} - Array de órdenes parseadas
 */
function importFromJSON(jsonString) {
    try {
        const orders = JSON.parse(jsonString);
        
        if (!Array.isArray(orders)) {
            throw new Error('El archivo debe contener un array de órdenes');
        }

        // Validar y normalizar cada orden
        return orders.map(order => ({
            po: order.po || '',
            part: order.part || '',
            qty: order.qty || '0',
            status: order.status || 'process',
            date: order.date || '',
            notes: order.notes || '',
            company: order.company || 'SUPRAJIT'
        }));
    } catch (error) {
        throw new Error(`Error al importar JSON: ${error.message}`);
    }
}

/**
 * Guarda las preferencias de rotación en localStorage
 */
function saveRotationPreferences() {
    if (typeof rotationState === 'undefined') return;
    
    const prefs = {
        isActive: rotationState.isActive,
        intervalDuration: rotationState.intervalDuration,
        lastCompanyIndex: rotationState.currentCompanyIndex
    };
    
    localStorage.setItem('smv_rotation_prefs', JSON.stringify(prefs));
}

/**
 * Carga las preferencias de rotación desde localStorage
 * @returns {Object|null} - Preferencias guardadas o null
 */
function loadRotationPreferences() {
    const saved = localStorage.getItem('smv_rotation_prefs');
    
    if (!saved) return null;
    
    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('❌ Error al cargar preferencias de rotación:', error);
        return null;
    }
}

/**
 * Actualiza el intervalo de rotación y lo guarda
 * @param {number} duration - Nueva duración en milisegundos
 */
function updateAndSaveRotationInterval(duration) {
    if (typeof updateRotationInterval === 'function') {
        updateRotationInterval(duration);
    }
    saveRotationPreferences();
}
