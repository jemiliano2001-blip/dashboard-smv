/**
 * Drag & Drop Module
 * Maneja el arrastre y reordenamiento de órdenes
 */

/**
 * Habilita drag & drop en un elemento de fila
 * @param {HTMLElement} rowElement - Elemento de fila
 * @param {number} index - Índice de la fila
 */
function enableDragDrop(rowElement, index) {
    rowElement.setAttribute('draggable', 'true');
    rowElement.addEventListener('dragstart', handleDragStart);
    rowElement.addEventListener('dragover', handleDragOver);
    rowElement.addEventListener('dragleave', handleDragLeave);
    rowElement.addEventListener('drop', handleDrop);
    rowElement.addEventListener('dragend', handleDragEnd);
}

/**
 * Deshabilita drag & drop en un elemento de fila
 * @param {HTMLElement} rowElement - Elemento de fila
 */
function disableDragDrop(rowElement) {
    rowElement.setAttribute('draggable', 'false');
    rowElement.removeEventListener('dragstart', handleDragStart);
    rowElement.removeEventListener('dragover', handleDragOver);
    rowElement.removeEventListener('dragleave', handleDragLeave);
    rowElement.removeEventListener('drop', handleDrop);
    rowElement.removeEventListener('dragend', handleDragEnd);
}

/**
 * Maneja el inicio del arrastre
 * @param {DragEvent} e - Evento de arrastre
 */
function handleDragStart(e) {
    const row = e.currentTarget;
    state.draggedIndex = parseInt(row.dataset.index);
    
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', row.innerHTML);
    
    // Crear preview visual del elemento arrastrado
    const ghost = row.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'rotate(2deg)';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.offsetX, e.offsetY);
    
    setTimeout(() => ghost.remove(), 0);
    
    console.log(`🎯 Arrastrando orden #${state.draggedIndex}`);
}

/**
 * Maneja el arrastre sobre otro elemento
 * @param {DragEvent} e - Evento de arrastre
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    const row = e.currentTarget;
    const targetIndex = parseInt(row.dataset.index);
    
    if (state.draggedIndex === targetIndex) {
        return false;
    }
    
    // Determinar si estamos en la mitad superior o inferior
    const rect = row.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    // Limpiar todas las clases de drag-over
    clearDragOverClasses();
    
    if (e.clientY < midpoint) {
        row.classList.add('drag-over-top');
    } else {
        row.classList.add('drag-over-bottom');
    }
    
    return false;
}

/**
 * Maneja cuando el cursor sale de un elemento durante el arrastre
 * @param {DragEvent} e - Evento de arrastre
 */
function handleDragLeave(e) {
    const row = e.currentTarget;
    row.classList.remove('drag-over-top', 'drag-over-bottom');
}

/**
 * Maneja el evento de soltar
 * @param {DragEvent} e - Evento de soltar
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const row = e.currentTarget;
    const targetIndex = parseInt(row.dataset.index);
    
    if (state.draggedIndex !== null && state.draggedIndex !== targetIndex) {
        // Determinar posición de inserción
        const rect = row.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        let insertIndex = targetIndex;
        
        if (e.clientY >= midpoint) {
            insertIndex = targetIndex + 1;
        }
        
        // Ajustar índice si arrastramos hacia abajo
        if (state.draggedIndex < insertIndex) {
            insertIndex--;
        }
        
        console.log(`📍 Soltando en índice: ${insertIndex}`);
        
        // Reordenar órdenes
        reorderOrders(state.draggedIndex, insertIndex);
    }
    
    return false;
}

/**
 * Maneja el fin del arrastre
 * @param {DragEvent} e - Evento de arrastre
 */
function handleDragEnd(e) {
    const row = e.currentTarget;
    row.classList.remove('dragging');
    
    // Limpiar todas las clases de drag-over
    clearDragOverClasses();
    
    state.draggedIndex = null;
    
    console.log('🏁 Arrastre finalizado');
}

/**
 * Limpia todas las clases de drag-over de todas las filas
 */
function clearDragOverClasses() {
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}
