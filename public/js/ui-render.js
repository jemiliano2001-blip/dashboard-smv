/**
 * UI Rendering Module
 * Maneja el renderizado del DOM y actualización visual
 */

let isRendering = false;
let calculateRowHeightsTimer = null;

// Spanish month abbreviations mapping (0-indexed for Date constructor)
const MONTH_MAP = {
    'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3,
    'MAY': 4, 'JUN': 5, 'JUL': 6, 'AGO': 7,
    'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
};

/**
 * Parses Spanish date formats like '01/ENE', '15/FEB' into Date objects
 * @param {string} dateStr - Date string in format 'DD/MMM'
 * @returns {Date} - Parsed date object (uses current year if not specified)
 */
function parseSmartDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return new Date(0); // Return epoch for invalid dates (sorts to beginning)
    }
    
    const parts = dateStr.trim().split('/');
    if (parts.length < 2) {
        return new Date(0);
    }
    
    const day = parseInt(parts[0], 10);
    const monthAbbr = parts[1].toUpperCase();
    const month = MONTH_MAP[monthAbbr];
    
    if (isNaN(day) || month === undefined) {
        return new Date(0);
    }
    
    // Use current year, or parse year if provided in format 'DD/MMM/YYYY'
    const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
    
    return new Date(year, month, day);
}

/**
 * Renderiza todas las órdenes en las dos columnas
 * Optimizado con DocumentFragment para reducir reflows/repaints
 */
function renderAllOrders() {
    if (isRendering) {
        return;
    }
    
    isRendering = true;
    
    requestAnimationFrame(() => {
        try {
            const leftCol = document.getElementById('colLeft');
            const rightCol = document.getElementById('colRight');
            
            if (!leftCol || !rightCol) {
                console.error('❌ Columnas no encontradas en el DOM');
                isRendering = false;
                return;
            }

            leftCol.querySelectorAll('.order-row').forEach(row => row.remove());
            rightCol.querySelectorAll('.order-row').forEach(row => row.remove());

            updateTotalOrders();

            if (!state.orders || state.orders.length === 0) {
                console.warn('⚠️ No hay órdenes para renderizar');
                isRendering = false;
                return;
            }
            
            console.log(`📊 Total de órdenes en estado: ${state.orders.length}`);
            
            const currentCompany = (typeof rotationState !== 'undefined' && 
                                   rotationState.companies.length > 1 && 
                                   rotationState.isActive) ? getCurrentCompany() : null;
            
            if (currentCompany) {
                console.log(`🔍 Filtrando por compañía: ${currentCompany}`);
            } else {
                console.log(`📋 Mostrando todas las órdenes`);
            }
            
            // Sort orders by date before rendering
            const sortedOrders = [...state.orders].sort((a, b) => {
                const dateA = parseSmartDate(a.date);
                const dateB = parseSmartDate(b.date);
                return dateA - dateB;
            });
            
            const leftFragment = document.createDocumentFragment();
            const rightFragment = document.createDocumentFragment();
            
            let visibleOrderCount = 0;
            
            sortedOrders.forEach((order, sortedIndex) => {
                // Find original index in state.orders for proper data binding
                const originalIndex = state.orders.findIndex(o => o === order);
                const shouldRender = !currentCompany || 
                                   !order.company || 
                                   order.company.trim().toUpperCase() === currentCompany.toUpperCase();
                
                if (!shouldRender) {
                    return;
                }
                
                try {
                    const row = createOrderRow(order, originalIndex);
                    
                    if (!row) {
                        console.error(`❌ Error creando fila para orden ${originalIndex}`);
                        return;
                    }
                    
                    const targetFragment = visibleOrderCount % 2 === 0 ? leftFragment : rightFragment;
                    targetFragment.appendChild(row);
                    
                    if (state.isEditing && typeof enableDragDrop === 'function') {
                        enableDragDrop(row, originalIndex);
                    }
                    
                    visibleOrderCount++;
                } catch (error) {
                    console.error(`❌ Error renderizando orden ${sortedIndex}:`, error);
                }
            });

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

            if (calculateRowHeightsTimer) {
                clearTimeout(calculateRowHeightsTimer);
            }
            calculateRowHeightsTimer = setTimeout(() => {
                calculateRowHeights();
                isRendering = false;
            }, 50);
        } catch (error) {
            console.error('❌ Error al renderizar órdenes:', error);
            isRendering = false;
        }
    });
}

/**
 * Crea el elemento HTML de una fila de orden
 * @param {Object} order - Datos de la orden
 * @param {number} index - Índice de la orden en state.orders
 * @returns {HTMLElement} - Elemento de fila
 */
function createOrderRow(order, index) {
    const div = document.createElement('div');
    
    let specialClass = '';
    if (order.status === 'hold') specialClass = 'row-urgent';
    if (order.status === 'invoiced') specialClass = 'row-invoiced';
    
    // Check for aging (orders older than 7 days and not 'done')
    const orderDate = parseSmartDate(order.date);
    const currentDate = new Date();
    const ageInDays = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
    const isAged = ageInDays > 7 && order.status !== 'done';
    
    // Aged styling overrides other statuses
    if (isAged) {
        specialClass = 'row-aged';
    }
    
    div.className = `order-row ${specialClass}`;
    div.dataset.index = index;
    
    div.innerHTML = createOrderRowHTML(order, index);
    
    attachCellListeners(div, index);
    
    return div;
}

/**
 * Genera el HTML interno de una fila de orden
 * @param {Object} order - Datos de la orden
 * @param {number} index - Índice de la orden en state.orders
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
    `;
}

/**
 * Calcula y aplica las alturas de las filas dinámicamente
 */
function calculateRowHeights() {
    const leftCol = document.getElementById('colLeft');
    const rightCol = document.getElementById('colRight');
    
    if (!leftCol || !rightCol || state.orders.length === 0) return;
    
    const leftRows = leftCol.querySelectorAll('.order-row');
    const rightRows = rightCol.querySelectorAll('.order-row');
    
    if (state.isDensityCompact) {
        const compactHeight = 48;
        leftRows.forEach(row => {
            row.style.height = `${compactHeight}px`;
            row.style.minHeight = `${compactHeight}px`;
        });
        rightRows.forEach(row => {
            row.style.height = `${compactHeight}px`;
            row.style.minHeight = `${compactHeight}px`;
        });
    } else {
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
