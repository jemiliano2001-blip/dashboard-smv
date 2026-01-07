/**
 * UI Interactions Module
 * Maneja los eventos y interacciones del usuario
 */

/**
 * Adjunta event listeners a las celdas editables de una fila
 * @param {HTMLElement} rowElement - Elemento de fila
 * @param {number} index - Índice de la orden
 */
function attachCellListeners(rowElement, index) {
    const cells = rowElement.querySelectorAll('.editable-cell');
    
    cells.forEach(cell => {
        // Evento blur: guardar cambios al perder foco
        cell.addEventListener('blur', (event) => handleCellBlur(event, index));
        
        // Evento keydown: Enter para guardar, Escape para cancelar
        cell.addEventListener('keydown', (event) => handleCellKeydown(event, index));
    });
    
    // Doble-click en la fila abre el modal de edición (si no está en modo edición)
    rowElement.addEventListener('dblclick', (event) => {
        if (!state.isEditing && typeof openEditModal === 'function') {
            event.preventDefault();
            openEditModal(index);
        }
    });
}

/**
 * Maneja el evento blur de una celda editable
 * @param {Event} event - Evento blur
 * @param {number} index - Índice de la orden
 */
function handleCellBlur(event, index) {
    const cell = event.target;
    const key = cell.dataset.key;
    const newValue = cell.innerText.trim();
    
    if (!state.orders[index]) return;
    
    // Normalizar PO si es necesario
    if (key === 'po') {
        state.orders[index][key] = normalizePO(newValue);
    } else {
        state.orders[index][key] = newValue;
    }
    
    // Remover clase de editing-row
    const row = cell.closest('.order-row');
    if (row) {
        row.classList.remove('editing-row');
    }
    
    state.editingRowIndex = null;
    
    // Guardar en Firestore
    saveOrderToStorage(state.orders[index], index).catch(error => {
        console.error('Error al guardar:', error);
    });
}

/**
 * Maneja eventos de teclado en celdas editables
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {number} index - Índice de la orden
 */
function handleCellKeydown(event, index) {
    const cell = event.target;
    const key = cell.dataset.key;
    
    if (event.key === 'Enter') {
        event.preventDefault();
        cell.blur();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        
        // Restaurar valor original
        const order = state.orders[index];
        if (order) {
            if (key === 'po') {
                cell.innerText = formatPO(order[key]);
            } else {
                cell.innerText = order[key] || '';
            }
        }
        
        cell.blur();
    }
}

/**
 * Maneja clicks en la ventana para cerrar modal con backdrop
 * @param {MouseEvent} event - Evento de click
 */
function handleModalBackdropClick(event) {
    const modal = document.getElementById('confirmModal');
    if (event.target === modal) {
        hideModal();
    }
}

/**
 * Maneja el evento de resize de ventana
 */
function handleWindowResize() {
    clearTimeout(state.resizeTimeout);
    state.resizeTimeout = setTimeout(() => {
        calculateRowHeights();
    }, 100);
}

/**
 * Maneja la tecla ESC global para cerrar modales
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('confirmModal');
        if (modal && modal.classList.contains('show')) {
            hideModal();
        }
    }
}

/**
 * Inicializa todos los event listeners globales
 */
function initializeGlobalListeners() {
    // Resize de ventana
    window.addEventListener('resize', handleWindowResize);
    
    // Tecla ESC global
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Click en backdrop del modal
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.addEventListener('click', handleModalBackdropClick);
    }
    
    console.log('✅ Event listeners globales inicializados');
}

/**
 * Limpia todos los event listeners (útil para cleanup)
 */
function cleanupGlobalListeners() {
    window.removeEventListener('resize', handleWindowResize);
    document.removeEventListener('keydown', handleGlobalKeydown);
    
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.removeEventListener('click', handleModalBackdropClick);
    }
}
