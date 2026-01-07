/**
 * Modal System Module
 * Maneja modales de confirmación y notificaciones
 */

/**
 * Muestra un modal de confirmación
 * @param {Object} config - Configuración del modal
 * @param {string} config.title - Título del modal
 * @param {string} config.message - Mensaje del modal
 * @param {string} config.confirmText - Texto del botón de confirmar
 * @param {Function} config.onConfirm - Callback al confirmar
 */
function showModal(config) {
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    if (!modal || !title || !message || !confirmBtn) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    title.innerText = config.title || '¿Confirmar acción?';
    message.innerText = config.message || '';
    confirmBtn.innerText = config.confirmText || 'Confirmar';
    confirmBtn.onclick = config.onConfirm || function() { hideModal(); };
    
    modal.classList.add('show');
    
    console.log('📋 Modal mostrado');
}

/**
 * Oculta el modal de confirmación
 */
function hideModal() {
    const modal = document.getElementById('confirmModal');
    
    if (modal) {
        modal.classList.remove('show');
        console.log('✖️ Modal cerrado');
    }
}

/**
 * Muestra el indicador de exportación exitosa
 */
function showExportIndicator() {
    const indicator = document.getElementById('exportIndicator');
    
    if (!indicator) return;
    
    indicator.classList.add('show');
    
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 3000);
    
    console.log('💾 Indicador de exportación mostrado');
}

/**
 * Muestra una notificación temporal
 * @param {Object} config - Configuración de la notificación
 * @param {string} config.message - Mensaje a mostrar
 * @param {string} config.type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} config.duration - Duración en ms (por defecto 3000)
 */
function showNotification(config) {
    const notification = document.createElement('div');
    
    // Estilos base
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        border: 2px solid;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        font-weight: 900;
        font-size: 0.875rem;
        z-index: 100;
        animation: fadeIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    // Estilos según tipo
    const types = {
        success: {
            bg: '#0a2a1a',
            color: '#00ff88',
            border: '#00ff88',
            icon: 'fa-check-circle'
        },
        error: {
            bg: '#2a0f0f',
            color: '#ff4757',
            border: '#ff4757',
            icon: 'fa-exclamation-circle'
        },
        warning: {
            bg: '#2a1a0f',
            color: '#ff6b35',
            border: '#ff6b35',
            icon: 'fa-exclamation-triangle'
        },
        info: {
            bg: '#001a1f',
            color: '#00d9ff',
            border: '#00d9ff',
            icon: 'fa-info-circle'
        }
    };
    
    const type = types[config.type] || types.info;
    
    notification.style.background = type.bg;
    notification.style.color = type.color;
    notification.style.borderColor = type.border;
    
    notification.innerHTML = `
        <i class="fas ${type.icon}"></i>
        <span>${config.message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover
    const duration = config.duration || 3000;
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Muestra un modal de migración de datos
 */
function showMigrationModal() {
    showModal({
        title: '¿Migrar datos?',
        message: 'Se encontraron datos en localStorage. ¿Deseas migrarlos a Firebase?',
        confirmText: 'Migrar',
        onConfirm: async () => {
            hideModal();
            try {
                const count = await migrateFromLocalStorage();
                showNotification({
                    type: 'success',
                    message: `${count} órdenes migradas exitosamente`
                });
            } catch (error) {
                showNotification({
                    type: 'error',
                    message: `Error al migrar: ${error.message}`
                });
            }
        }
    });
}
