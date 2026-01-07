/**
 * Order Operations Module
 * Maneja CRUD de órdenes (crear, leer, actualizar, eliminar)
 */

/**
 * Agrega N órdenes nuevas al inicio
 * @param {number} count - Número de órdenes a agregar
 */
async function addNewOrders(count) {
    const today = getCurrentDateFormatted();
    
    for (let i = 0; i < count; i++) {
        const newOrder = {
            po: '',
            part: '',
            qty: '0',
            status: 'process',
            date: today,
            notes: '',
            company: 'SUPRAJIT'
        };
        
        state.orders.unshift(newOrder);
    }
    
    renderAllOrders();
    
    // Guardar todas las órdenes con sus nuevos índices
    try {
        await saveAllOrders(state.orders);
        console.log(`✅ ${count} órdenes agregadas`);
    } catch (error) {
        console.error('Error al agregar órdenes:', error);
    }
}

/**
 * Agrega una orden al final
 */
async function addOrderAtEnd() {
    const today = getCurrentDateFormatted();
    
    const newOrder = {
        po: '',
        part: '',
        qty: '0',
        status: 'process',
        date: today,
        notes: '',
        company: 'SUPRAJIT'
    };
    
    state.orders.push(newOrder);
    renderAllOrders();
    
    // Guardar la nueva orden
    try {
        await saveOrderToStorage(newOrder, state.orders.length - 1);
        console.log('✅ Orden agregada al final');
    } catch (error) {
        console.error('Error al agregar orden:', error);
    }
}

/**
 * Duplica una orden existente
 * @param {number} index - Índice de la orden a duplicar
 */
async function duplicateOrder(index) {
    const order = state.orders[index];
    
    if (!order) return;
    
    // Crear copia profunda
    const duplicatedOrder = JSON.parse(JSON.stringify(order));
    
    // Remover ID para que se cree como nueva
    delete duplicatedOrder.id;
    
    // Insertar después de la orden original
    state.orders.splice(index + 1, 0, duplicatedOrder);
    
    renderAllOrders();
    
    // Guardar con reindexación
    try {
        await saveAllOrders(state.orders);
        console.log('✅ Orden duplicada');
        
        // Animar la nueva fila
        setTimeout(() => {
            const rows = document.querySelectorAll('.order-row');
            const newRow = Array.from(rows).find(row => row.dataset.index == (index + 1));
            if (newRow) {
                newRow.classList.add('adding');
            }
        }, 50);
    } catch (error) {
        console.error('Error al duplicar orden:', error);
    }
}

/**
 * Elimina una orden con confirmación modal
 * @param {number} index - Índice de la orden a eliminar
 */
function deleteOrderWithConfirmation(index) {
    const order = state.orders[index];
    
    if (!order) return;
    
    showModal({
        title: '¿Eliminar orden?',
        message: `PO: ${formatPO(order.po)} - ${order.part || 'Sin descripción'}`,
        confirmText: 'Eliminar',
        onConfirm: () => {
            animateAndDeleteOrder(index);
            hideModal();
        }
    });
}

/**
 * Anima y elimina una orden
 * @param {number} index - Índice de la orden
 */
async function animateAndDeleteOrder(index) {
    const row = document.querySelector(`.order-row[data-index="${index}"]`);
    const order = state.orders[index];
    
    if (row) {
        row.classList.add('removing');
        
        // Esperar a que termine la animación
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Eliminar de Firestore si tiene ID
    if (order && order.id) {
        try {
            await deleteOrderFromStorage(order.id);
        } catch (error) {
            console.error('Error al eliminar de Firestore:', error);
        }
    }
    
    // Eliminar del state
    state.orders.splice(index, 1);
    
    // Re-renderizar
    renderAllOrders();
    
    console.log('✅ Orden eliminada');
}

/**
 * Cambia el estatus de una orden al siguiente en el ciclo (solo en modo edición)
 * @param {number} index - Índice de la orden
 */
async function cycleOrderStatus(index) {
    // Solo permitir en modo edición
    if (!state.isEditing) return;
    
    const order = state.orders[index];
    if (!order) return;
    
    const currentStatus = order.status;
    const statusCodes = STATUS_OPTIONS.map(s => s.code);
    const currentIndex = statusCodes.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCodes.length;
    
    order.status = statusCodes[nextIndex];
    
    // Actualizar solo esta fila
    updateSingleRow(index);
    
    // Guardar en Firestore
    try {
        await saveOrderToStorage(order, index);
        console.log(`✅ Estatus cambiado a: ${order.status}`);
    } catch (error) {
        console.error('Error al cambiar estatus:', error);
    }
}

/**
 * Reordena las órdenes después de un drag & drop
 * @param {number} fromIndex - Índice original
 * @param {number} toIndex - Índice destino
 */
async function reorderOrders(fromIndex, toIndex) {
    // Extraer la orden movida
    const [movedOrder] = state.orders.splice(fromIndex, 1);
    
    // Insertar en la nueva posición
    state.orders.splice(toIndex, 0, movedOrder);
    
    // Re-renderizar
    renderAllOrders();
    
    // Guardar el nuevo orden en Firestore
    try {
        await saveAllOrders(state.orders);
        console.log('✅ Órdenes reordenadas');
    } catch (error) {
        console.error('Error al reordenar:', error);
    }
}
