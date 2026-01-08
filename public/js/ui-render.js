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

            // Actualizar contador
            updateTotalOrders();

            if (!state.orders || state.orders.length === 0) {
                console.warn('⚠️ No hay órdenes para renderizar');
                isRendering = false;
                return;
            }
            
            console.log(`📊 Total de órdenes en estado: ${state.orders.length}`);
            
            // Determinar si hay filtro de compañía activo
            const currentCompany = (typeof rotationState !== 'undefined' && 
                                   rotationState.companies.length > 1 && 
                                   rotationState.isActive) ? getCurrentCompany() : null;
            
            if (currentCompany) {
                console.log(`🔍 Filtrando por compañía: ${currentCompany}`);
            } else {
                console.log(`📋 Mostrando todas las órdenes`);
            }
            
            // Create DocumentFragments for batch DOM insertion
            const leftFragment = document.createDocumentFragment();
            const rightFragment = document.createDocumentFragment();
            
            // First pass: collect orders to render
            const ordersToRender = [];
            state.orders.forEach((order, originalIndex) => {
                // Check if we should render this order (company filter)
                const shouldRender = !currentCompany || 
                                   !order.company || 
                                   order.company.trim().toUpperCase() === currentCompany.toUpperCase();
                
                if (shouldRender) {
                    ordersToRender.push({ order, originalIndex });
                }
            });
            
            // Sort by date (earliest first) - format dd/mm/yy
            ordersToRender.sort((a, b) => {
                const parseDate = (dateStr) => {
                    if (!dateStr) return new Date(9999, 11, 31); // Empty dates go last
                    const parts = dateStr.split('/');
                    if (parts.length !== 3) return new Date(9999, 11, 31);
                    const [day, month, year] = parts.map(Number);
                    const fullYear = year < 50 ? 2000 + year : 1900 + year;
                    return new Date(fullYear, month - 1, day);
                };
                return parseDate(a.order.date) - parseDate(b.order.date);
            });
            
            // Calculate midpoint for column distribution
            const midPoint = Math.ceil(ordersToRender.length / 2);
            
            // Second pass: render with proper column distribution
            ordersToRender.forEach(({ order, originalIndex }, renderIndex) => {
                try {
                    // Create row with ORIGINAL index from state.orders
                    const row = createOrderRow(order, originalIndex);
                    
                    if (!row) {
                        console.error(`❌ Error creando fila para orden ${originalIndex}`);
                        return;
                    }
                    
                    // Distribute orders between columns (first half left, second half right)
                    const targetFragment = renderIndex < midPoint ? leftFragment : rightFragment;
                    targetFragment.appendChild(row);
                    
                    // Habilitar drag & drop si estamos en modo edición
                    if (state.isEditing && typeof enableDragDrop === 'function') {
                        enableDragDrop(row, originalIndex);
                    }
                } catch (error) {
                    console.error(`❌ Error renderizando orden ${originalIndex}:`, error);
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
            // DISABLED: No longer enabling inline contentEditable during re-renders
            // if (state.isEditing) {
            //     applyEditMode(true);
            // }
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
        
        ${createEditModeActionsHTML(index)}
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
