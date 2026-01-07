/**
 * Edit Mode Module
 * Maneja el modo de edición y densidad de la interfaz
 */

/**
 * Alterna entre modo edición y modo normal
 */
function toggleEditMode() {
    state.isEditing = !state.isEditing;
    
    const btn = document.getElementById('editBtn');
    const controls = document.getElementById('editControls');
    
    document.body.classList.toggle('editing-mode', state.isEditing);
    
    if (state.isEditing) {
        // Entrar en modo edición
        btn.innerHTML = '<i class="fas fa-check text-xl"></i>';
        btn.classList.remove('bg-[#A8C7FA]');
        btn.classList.add('bg-[#6DD58C]');
        btn.title = 'Salir del modo edición';
        controls.classList.remove('hidden');
        
        applyEditMode(true);
        
        // Habilitar drag & drop en todas las filas
        document.querySelectorAll('.order-row').forEach((row, index) => {
            enableDragDrop(row, index);
        });
        
        console.log('✏️ Modo edición activado');
    } else {
        // Salir del modo edición
        btn.innerHTML = '<i class="fas fa-pen text-xl"></i>';
        btn.classList.remove('bg-[#6DD58C]');
        btn.classList.add('bg-[#A8C7FA]');
        btn.title = 'Modo edición';
        controls.classList.add('hidden');
        
        applyEditMode(false);
        
        // Deshabilitar edición inline si hay alguna fila siendo editada
        if (state.editingRowIndex !== null) {
            const row = document.querySelector(`.order-row[data-index="${state.editingRowIndex}"]`);
            if (row) {
                row.classList.remove('editing-row');
                const cells = row.querySelectorAll('.editable-cell');
                cells.forEach(cell => cell.contentEditable = false);
            }
            state.editingRowIndex = null;
        }
        
        // Deshabilitar drag & drop
        document.querySelectorAll('.order-row').forEach(row => {
            disableDragDrop(row);
        });
        
        // Auto-guardar al salir del modo edición
        saveAllOrders(state.orders).catch(error => {
            console.error('Error al guardar:', error);
        });
        
        console.log('👁️ Modo vista activado');
    }
}

/**
 * Aplica o remueve el estado editable de las celdas
 * @param {boolean} enable - true para habilitar edición
 */
function applyEditMode(enable) {
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.contentEditable = enable;
    });
}

/**
 * Edita una fila específica (modo inline)
 * @param {number} index - Índice de la fila a editar
 */
function editRowInline(index) {
    // Si ya hay una fila siendo editada, desactivarla
    if (state.editingRowIndex !== null && state.editingRowIndex !== index) {
        const prevRow = document.querySelector(`.order-row[data-index="${state.editingRowIndex}"]`);
        if (prevRow) {
            prevRow.classList.remove('editing-row');
            const cells = prevRow.querySelectorAll('.editable-cell');
            cells.forEach(cell => cell.contentEditable = false);
        }
    }
    
    state.editingRowIndex = index;
    const row = document.querySelector(`.order-row[data-index="${index}"]`);
    
    if (!row) return;
    
    row.classList.add('editing-row');
    const cells = row.querySelectorAll('.editable-cell');
    
    cells.forEach(cell => {
        cell.contentEditable = true;
    });
    
    // Focus en la primera celda
    const firstCell = cells[0];
    if (firstCell) {
        firstCell.focus();
        
        // Seleccionar todo el texto
        const range = document.createRange();
        range.selectNodeContents(firstCell);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Alterna el modo de densidad (normal/compacto)
 */
function toggleDensityMode() {
    state.isDensityCompact = !state.isDensityCompact;
    document.body.classList.toggle('compact-mode', state.isDensityCompact);
    
    saveDensityPreference(state.isDensityCompact);
    updateDensityButton();
    
    // Recalcular alturas después de cambiar densidad
    setTimeout(() => {
        calculateRowHeights();
    }, 50);
    
    console.log(`📐 Modo densidad: ${state.isDensityCompact ? 'Compacto' : 'Normal'}`);
}

/**
 * Actualiza la apariencia del botón de densidad
 */
function updateDensityButton() {
    const btn = document.getElementById('densityBtn');
    
    if (!btn) return;
    
    if (state.isDensityCompact) {
        btn.innerHTML = '<i class="fas fa-compress-alt text-sm"></i>';
        btn.title = 'Modo Normal';
        btn.style.borderColor = '#00ff88';
        btn.style.background = '#0a2a1a';
    } else {
        btn.innerHTML = '<i class="fas fa-expand-alt text-sm"></i>';
        btn.title = 'Modo Compacto';
        btn.style.borderColor = '#ffa500';
        btn.style.background = '#2a1a0f';
    }
}

/**
 * Inicializa el modo de densidad desde preferencias guardadas
 */
function initializeDensityMode() {
    const savedDensity = loadDensityPreference();
    
    if (savedDensity) {
        state.isDensityCompact = true;
        document.body.classList.add('compact-mode');
    }
    
    updateDensityButton();
}
