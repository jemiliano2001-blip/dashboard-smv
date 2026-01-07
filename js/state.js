/**
 * Global Application State
 * Maneja el estado central de la aplicación
 */

/**
 * @typedef {Object} Order
 * @property {string} [id] - ID de Firestore (opcional para nuevas órdenes)
 * @property {string} po - Número de PO
 * @property {string} part - Número de parte
 * @property {string} qty - Cantidad
 * @property {string} status - Código de estatus
 * @property {string} date - Fecha en formato dd/mm/yy
 * @property {string} notes - Notas adicionales
 * @property {string} company - Compañía/Cliente
 */

/**
 * Estado global de la aplicación
 */
const state = {
    /** @type {Order[]} Array de órdenes */
    orders: [],
    
    /** @type {boolean} Modo de edición activo */
    isEditing: false,
    
    /** @type {boolean} Modo de densidad compacta */
    isDensityCompact: false,
    
    /** @type {number|null} Índice de la fila siendo arrastrada */
    draggedIndex: null,
    
    /** @type {number|null} Índice de la fila siendo editada inline */
    editingRowIndex: null,
    
    /** @type {number} Timestamp de la última exportación */
    lastExportTime: 0,
    
    /** @type {boolean} Estado de conexión a Firebase */
    isFirebaseConnected: false,
    
    /** @type {Function|null} Función para desuscribirse de Firestore */
    unsubscribeFirestore: null
};

/**
 * Obtiene las órdenes actuales
 * @returns {Order[]}
 */
function getOrders() {
    return state.orders;
}

/**
 * Establece las órdenes
 * @param {Order[]} orders - Nuevo array de órdenes
 */
function setOrders(orders) {
    state.orders = orders;
}

/**
 * Obtiene una orden por índice
 * @param {number} index - Índice de la orden
 * @returns {Order|undefined}
 */
function getOrderByIndex(index) {
    return state.orders[index];
}

/**
 * Actualiza una orden por índice
 * @param {number} index - Índice de la orden
 * @param {Order} order - Datos actualizados de la orden
 */
function updateOrderByIndex(index, order) {
    if (index >= 0 && index < state.orders.length) {
        state.orders[index] = { ...state.orders[index], ...order };
    }
}

/**
 * Agrega una orden al inicio del array
 * @param {Order} order - Orden a agregar
 */
function addOrderAtStart(order) {
    state.orders.unshift(order);
}

/**
 * Agrega una orden al final del array
 * @param {Order} order - Orden a agregar
 */
function addOrderAtEnd(order) {
    state.orders.push(order);
}

/**
 * Elimina una orden por índice
 * @param {number} index - Índice de la orden a eliminar
 * @returns {Order|undefined} Orden eliminada
 */
function removeOrderByIndex(index) {
    if (index >= 0 && index < state.orders.length) {
        return state.orders.splice(index, 1)[0];
    }
    return undefined;
}

/**
 * Mueve una orden de un índice a otro
 * @param {number} fromIndex - Índice origen
 * @param {number} toIndex - Índice destino
 */
function moveOrder(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < state.orders.length &&
        toIndex >= 0 && toIndex < state.orders.length) {
        const [movedOrder] = state.orders.splice(fromIndex, 1);
        state.orders.splice(toIndex, 0, movedOrder);
    }
}

/**
 * Cuenta total de órdenes
 * @returns {number}
 */
function getOrdersCount() {
    return state.orders.length;
}

/**
 * Verifica si el modo de edición está activo
 * @returns {boolean}
 */
function isEditingMode() {
    return state.isEditing;
}

/**
 * Establece el modo de edición
 * @param {boolean} editing - Nuevo estado
 */
function setEditingMode(editing) {
    state.isEditing = editing;
}

/**
 * Verifica si el modo compacto está activo
 * @returns {boolean}
 */
function isCompactMode() {
    return state.isDensityCompact;
}

/**
 * Establece el modo de densidad
 * @param {boolean} compact - Nuevo estado
 */
function setDensityMode(compact) {
    state.isDensityCompact = compact;
}

/**
 * Obtiene el índice de la fila siendo editada
 * @returns {number|null}
 */
function getEditingRowIndex() {
    return state.editingRowIndex;
}

/**
 * Establece el índice de la fila siendo editada
 * @param {number|null} index - Índice o null
 */
function setEditingRowIndex(index) {
    state.editingRowIndex = index;
}

/**
 * Verifica si Firebase está conectado
 * @returns {boolean}
 */
function isFirebaseReady() {
    return state.isFirebaseConnected;
}

/**
 * Establece el estado de conexión de Firebase
 * @param {boolean} connected - Estado de conexión
 */
function setFirebaseConnected(connected) {
    state.isFirebaseConnected = connected;
}
