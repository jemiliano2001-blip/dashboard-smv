/**
 * UI Rendering Module
 * Maneja el renderizado del DOM y actualización visual
 */

// Flag para prevenir renderizados simultáneos
let isRendering = false;
let calculateRowHeightsTimer = null;

/**
 * Renderiza todas las órdenes en las dos columnas
 * Optimizado con DocumentFragment para reducir reflows/repaints
 */
function renderAllOrders() {
    // Prevenir renderizados simultáneos
    if (isRendering) {
        return;
    }
    
    isRendering = true;
    
    // Wrap DOM manipulation in requestAnimationFrame for optimal frame timing
    requestAnimationFrame(() => {
        try {
            const leftCol = document.getElementById('colLeft');
            const rightCol = document.getElementById('colRight');
            
            if (!leftCol || !rightCol) {
                console.error('❌ Columnas no encontradas en el DOM');
                isRendering = false;
                return;
            }

            // Remover solo las filas de órdenes, preservando el botón de agregar
            leftCol.querySelectorAll('.order-row').forEach(row => row.remove());
            rightCol.querySelectorAll('.order-row').forEach(row => row.remove());

            // Actualizar estado vacío y contador
            updateEmptyState();
            updateTotalOrders();

            // Determinar qué órdenes renderizar
            let orders = state.orders || [];
            
            console.log(`📊 Total de órdenes en estado: ${orders.length}`);
            
            // Solo filtrar si hay múltiples compañías Y el sistema de rotación está activo
            if (typeof rotationState !== 'undefined' && 
                rotationState.companies.length > 1 && 
                rotationState.isActive) {
                const currentCompany = getCurrentCompany();
                if (currentCompany) {
                    const filtered = filterOrdersByCompany(currentCompany);
                    console.log(`🔍 Filtrando por compañía: ${currentCompany} (${filtered.length} de ${orders.length} órdenes)`);
                    orders = filtered;
                }
            } else {
                console.log(`📋 Mostrando todas las órdenes: ${orders.length}`);
            }
            
            if (orders.length === 0 && state.orders.length > 0) {
                console.warn('⚠️ Filtro eliminó todas las órdenes, mostrando todas');
                orders = state.orders;
            }
            
            if (orders.length === 0) {
                console.warn('⚠️ No hay órdenes para renderizar');
                console.log('Estado actual:', {
                    totalOrders: state.orders.length,
                    rotationState: typeof rotationState !== 'undefined' ? {
                        companies: rotationState.companies,
                        currentIndex: rotationState.currentCompanyIndex,
                        isActive: rotationState.isActive
                    } : 'no definido'
                });
                isRendering = false;
                return;
            }
            
            // Create DocumentFragments for batch DOM insertion
            const leftFragment = document.createDocumentFragment();
            const rightFragment = document.createDocumentFragment();
            
            const midPoint = Math.ceil(orders.length / 2);
            
            orders.forEach((order, index) => {
                try {
                    const row = createOrderRow(order, index);
                    
                    if (!row) {
                        console.error(`❌ Error creando fila para orden ${index}`);
                        return;
                    }
                    
                    // Append to appropriate fragment
                    const targetFragment = index < midPoint ? leftFragment : rightFragment;
                    targetFragment.appendChild(row);
                    
                    // Habilitar drag & drop si estamos en modo edición
                    if (state.isEditing && typeof enableDragDrop === 'function') {
                        enableDragDrop(row, index);
                    }
                } catch (error) {
                    console.error(`❌ Error renderizando orden ${index}:`, error);
                }
            });

            // Single paint frame append - preserves .add-order-btn
            const leftAddBtn = leftCol.querySelector('.add-order-btn');
            const rightAddBtn = rightCol.querySelector('.add-order-btn');
            
            if (leftAddBtn) {
                leftCol.insertBefore(leftFragment, leftAddBtn);
            } else {
                leftCol.appendChild(leftFragment);
            }
            
            if (rightAddBtn) {
                rightCol.insertBefore(rightFragment, rightAddBtn);
            } else {
                rightCol.appendChild(rightFragment);
            }

            // Calcular alturas después de renderizar (con debounce)
            if (calculateRowHeightsTimer) {
                clearTimeout(calculateRowHeightsTimer);
            }
            calculateRowHeightsTimer = setTimeout(() => {
                calculateRowHeights();
                isRendering = false;
            }, 50);

            // Aplicar modo edición si está activo
            if (state.isEditing) {
                applyEditMode(true);
            }
        } catch (error) {
            console.error('❌ Error al renderizar órdenes:', error);
            isRendering = false;
        }
    });
}

/**
 * Crea el elemento HTML de una fila de orden
 * @param {Object} order - Datos de la orden
 * @param {number} index - Índice de la orden
 * @returns {HTMLElement} - Elemento de fila
 */
function createOrderRow(order, index) {
    const div = document.createElement('div');
    
    // Determinar clases especiales
    let specialClass = '';
    if (order.status === 'hold') specialClass = 'row-urgent';
    if (order.status === 'invoiced') specialClass = 'row-invoiced';
    
    div.className = `order-row ${specialClass}`;
    div.dataset.index = index;
    
    div.innerHTML = createOrderRowHTML(order, index);
    
    // Adjuntar event listeners a las celdas editables
    attachCellListeners(div, index);
    
    return div;
}

/**
 * Genera el HTML interno de una fila de orden
 * @param {Object} order - Datos de la orden
 * @param {number} index - Índice de la orden
 * @returns {string} - HTML string
 */
function createOrderRowHTML(order, index) {
    return `
        <div class="drag-handle" title="Arrastrar para reordenar">
            <i class="fas fa-grip-vertical"></i>
        </div>
        
        <div class="w-po font-medium editable-cell truncate" 
             data-key="po"
             style="font-family: var(--font-mono);">
            ${formatPO(order.po)}
        </div>
        
        <div class="w-part font-medium editable-cell truncate pl-2" 
             data-key="part">
            ${escapeHTML(order.part)}
        </div>
        
        <div class="w-qty font-medium editable-cell" 
             data-key="qty"
             style="font-family: var(--font-mono);">
            ${escapeHTML(order.qty)}
        </div>
        
        <div class="w-status px-2">
            <span class="badge-compact ${getStatusClass(order.status)}" 
                  onclick="cycleOrderStatus(${index})"
                  title="Click to change status">
                ${getStatusLabel(order.status)}
            </span>
        </div>
        
        <div class="w-date font-medium editable-cell" 
             data-key="date">
            ${escapeHTML(order.date)}
        </div>
        
        ${createInlineActionsHTML(index)}
        ${createEditModeActionsHTML(index)}
    `;
}

/**
 * Crea el HTML de las acciones inline (hover)
 * @param {number} index - Índice de la orden
 * @returns {string} - HTML string
 */
function createInlineActionsHTML(index) {
    return `
        <div class="row-actions-inline">
            <div class="action-icon-inline action-icon-edit" 
                 onclick="editRowInline(${index})" 
                 title="Editar fila">
                <i class="fas fa-pen"></i>
            </div>
            <div class="action-icon-inline action-icon-duplicate" 
                 onclick="duplicateOrder(${index})" 
                 title="Duplicar orden">
                <i class="fas fa-copy"></i>
            </div>
            <div class="action-icon-inline action-icon-delete" 
                 onclick="deleteOrderWithConfirmation(${index})" 
                 title="Eliminar orden">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML del botón de eliminar en modo edición
 * @param {number} index - Índice de la orden
 * @returns {string} - HTML string
 */
function createEditModeActionsHTML(index) {
    return `
        <div class="action-btn absolute right-4 cursor-pointer transition hover:scale-110" 
             onclick="deleteOrderWithConfirmation(${index})" 
             title="Eliminar orden">
            <i class="fas fa-times"></i>
        </div>
    `;
}

/**
 * Calcula y aplica las alturas de las filas dinámicamente
 */
function calculateRowHeights() {
    const leftCol = document.getElementById('colLeft');
    const rightCol = document.getElementById('colRight');
    
    if (!leftCol || !rightCol || state.orders.length === 0) return;
    
    const midPoint = Math.ceil(state.orders.length / 2);
    const leftCount = midPoint;
    const rightCount = state.orders.length - midPoint;
    
    const leftRows = leftCol.querySelectorAll('.order-row');
    const rightRows = rightCol.querySelectorAll('.order-row');
    
    // En modo compacto, usar altura fija
    if (state.isDensityCompact) {
        const compactHeight = 48; // Updated for compact mode
        leftRows.forEach(row => {
            row.style.height = `${compactHeight}px`;
            row.style.minHeight = `${compactHeight}px`;
        });
        rightRows.forEach(row => {
            row.style.height = `${compactHeight}px`;
            row.style.minHeight = `${compactHeight}px`;
        });
    } else {
        // En modo normal, permitir que auto-ajuste o usar una altura mínima confortable
        // Material design cards don't usually stretch to fill height like tables, 
        // so we'll just ensure they have the minimum height.
        // We can remove the forced height calculation for a cleaner card look.
        leftRows.forEach(row => {
            row.style.height = 'auto';
            row.style.minHeight = 'var(--row-min-height)';
        });
        rightRows.forEach(row => {
            row.style.height = 'auto';
            row.style.minHeight = 'var(--row-min-height)';
        });
    }
}

/**
 * Actualiza el mensaje de estado vacío
 */
function updateEmptyState() {
    const emptyMsg = document.getElementById('emptyMsg');
    if (emptyMsg) {
        emptyMsg.classList.toggle('hidden', state.orders.length > 0);
    }
}

/**
 * Actualiza el contador de órdenes totales
 */
function updateTotalOrders() {
    const totalElement = document.getElementById('totalOrders');
    if (totalElement) {
        totalElement.innerText = `Total: ${state.orders.length}`;
    }
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Re-renderiza una fila específica sin re-renderizar todo
 * @param {number} index - Índice de la fila a actualizar
 */
function updateSingleRow(index) {
    const existingRow = document.querySelector(`.order-row[data-index="${index}"]`);
    if (!existingRow) {
        renderAllOrders();
        return;
    }

    const order = state.orders[index];
    const newRow = createOrderRow(order, index);
    
    existingRow.replaceWith(newRow);
    
    if (state.isEditing) {
        enableDragDrop(newRow, index);
    }
}
