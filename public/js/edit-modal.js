/**
 * Edit Modal Module
 * Sistema híbrido de edición con modal
 */

let editModalState = {
    isOpen: false,
    editingIndex: null,
    originalOrder: null
};

/**
 * Abre el modal de edición para una orden específica
 * @param {number} index - Índice de la orden a editar
 */
function openEditModal(index) {
    if (!state.orders[index]) return;
    
    editModalState.isOpen = true;
    editModalState.editingIndex = index;
    editModalState.originalOrder = { ...state.orders[index] };
    
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    
    // Actualizar autocomplete antes de abrir
    setupAutocomplete();
    
    // Llenar campos con datos actuales
    document.getElementById('editPO').value = state.orders[index].po || '';
    document.getElementById('editPart').value = state.orders[index].part || '';
    document.getElementById('editQty').value = state.orders[index].qty || '';
    document.getElementById('editDate').value = state.orders[index].date || '';
    document.getElementById('editCompany').value = state.orders[index].company || '';
    
    // Marcar el estado actual
    selectStatus(state.orders[index].status || 'process');
    
    // Mostrar modal con animación
    modal.classList.add('show');
    modal.classList.remove('closing');
    
    // Focus en primer campo
    setTimeout(() => {
        document.getElementById('editPO').focus();
        document.getElementById('editPO').select();
    }, 100);
    
    console.log(`✏️ Modal abierto para orden ${index}`);
}

/**
 * Cierra el modal de edición
 * @param {boolean} animated - Si debe usar animación de salida
 */
function closeEditModal(animated = true) {
    const modal = document.getElementById('editModal');
    
    if (animated) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.classList.remove('show', 'closing');
            resetEditModalState();
        }, 350);
    } else {
        modal.classList.remove('show', 'closing');
        resetEditModalState();
    }
    
    console.log('✅ Modal cerrado');
}

/**
 * Reset del estado del modal
 */
function resetEditModalState() {
    editModalState.isOpen = false;
    editModalState.editingIndex = null;
    editModalState.originalOrder = null;
    
    // Limpiar validación visual
    document.querySelectorAll('.edit-field').forEach(field => {
        field.classList.remove('field-error', 'field-success');
    });
}

/**
 * Selecciona un estado en el grid de badges
 * @param {string} status - Estado a seleccionar
 */
function selectStatus(status) {
    document.querySelectorAll('.status-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.status-option[data-status="${status}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

/**
 * Valida los campos del formulario
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateEditForm() {
    const errors = [];
    const po = document.getElementById('editPO').value.trim();
    const part = document.getElementById('editPart').value.trim();
    const qty = document.getElementById('editQty').value.trim();
    
    // Limpiar estados previos
    document.querySelectorAll('.edit-field').forEach(field => {
        field.classList.remove('field-error', 'field-success');
    });
    
    if (!po) {
        errors.push('PO # es requerido');
        document.getElementById('editPO').classList.add('field-error');
    } else {
        document.getElementById('editPO').classList.add('field-success');
    }
    
    if (!part) {
        errors.push('Parte es requerida');
        document.getElementById('editPart').classList.add('field-error');
    } else {
        document.getElementById('editPart').classList.add('field-success');
    }
    
    if (!qty) {
        errors.push('Cantidad es requerida');
        document.getElementById('editQty').classList.add('field-error');
    } else {
        document.getElementById('editQty').classList.add('field-success');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Guarda los cambios del modal
 */
async function saveEditModal() {
    const validation = validateEditForm();
    
    if (!validation.valid) {
        showNotification({
            type: 'error',
            message: validation.errors[0]
        });
        return;
    }
    
    const index = editModalState.editingIndex;
    const selectedStatus = document.querySelector('.status-option.selected');
    
    if (!state.orders[index] || !selectedStatus) return;
    
    // Actualizar orden
    state.orders[index] = {
        ...state.orders[index],
        po: document.getElementById('editPO').value.trim(),
        part: document.getElementById('editPart').value.trim(),
        qty: document.getElementById('editQty').value.trim(),
        date: document.getElementById('editDate').value.trim(),
        company: document.getElementById('editCompany').value.trim(),
        status: selectedStatus.dataset.status
    };
    
    // Guardar en Firestore
    try {
        await saveOrderToStorage(state.orders[index], index);
        
        // Actualizar UI
        updateSingleRow(index);
        
        // Cerrar modal
        closeEditModal();
        
        showNotification({
            type: 'success',
            message: 'Orden actualizada'
        });
        
        console.log('✅ Orden guardada desde modal');
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        showNotification({
            type: 'error',
            message: 'Error al guardar orden'
        });
    }
}

/**
 * Cancela la edición y restaura valores originales
 */
function cancelEditModal() {
    closeEditModal();
}

/**
 * Maneja eventos de teclado en el modal
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleEditModalKeydown(event) {
    if (!editModalState.isOpen) return;
    
    if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditModal();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        saveEditModal();
    }
}

/**
 * Muestra una notificación toast
 * @param {Object} options - { type: 'success'|'error', message: string }
 */
function showNotification(options) {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${options.type}`;
    toast.innerHTML = `
        <i class="fas fa-${options.type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${options.message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Obtiene valores únicos para autocomplete
 * @param {string} field - Campo del que obtener valores
 * @returns {Array} - Array de valores únicos
 */
function getUniqueValues(field) {
    const values = state.orders.map(order => order[field]).filter(Boolean);
    return [...new Set(values)].sort();
}

/**
 * Configura autocomplete en campos
 */
function setupAutocomplete() {
    // PO autocomplete
    const poInput = document.getElementById('editPO');
    const poList = document.getElementById('poList');
    
    if (poInput && poList) {
        const uniquePOs = getUniqueValues('po');
        poList.innerHTML = uniquePOs.map(po => `<option value="${po}">`).join('');
    }
    
    // Part autocomplete
    const partInput = document.getElementById('editPart');
    const partList = document.getElementById('partList');
    
    if (partInput && partList) {
        const uniqueParts = getUniqueValues('part');
        partList.innerHTML = uniqueParts.map(part => `<option value="${part}">`).join('');
    }
    
    // Company autocomplete
    const companyInput = document.getElementById('editCompany');
    const companyList = document.getElementById('companyList');
    
    if (companyInput && companyList) {
        // Combine predefined companies with existing companies from orders
        const existingCompanies = getUniqueValues('company');
        const predefinedCompanies = Object.keys(COMPANY_CONFIG);
        const allCompanies = [...new Set([...predefinedCompanies, ...existingCompanies])];
        // Sort alphabetically
        const sortedCompanies = allCompanies.sort();
        companyList.innerHTML = sortedCompanies.map(company => `<option value="${company}">`).join('');
    }
}

/**
 * Inicializa el sistema de modal
 */
function initializeEditModal() {
    // Escuchar teclas globales
    document.addEventListener('keydown', handleEditModalKeydown);
    
    // Cerrar modal al hacer click en backdrop
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cancelEditModal();
            }
        });
    }
    
    // Configurar autocomplete siempre (incluye companies predefinidas)
    setupAutocomplete();
    
    console.log('✅ Sistema de modal inicializado');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditModal);
} else {
    initializeEditModal();
}
