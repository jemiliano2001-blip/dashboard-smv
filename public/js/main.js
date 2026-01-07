/**
 * Main Application Entry Point
 * Orquesta la inicialización y gestión de todos los módulos
 */

/**
 * Inicializa la aplicación
 */
async function initializeApp() {
    console.log('🚀 Iniciando SMV Dashboard...');
    
    try {
        // 1. Inicializar densidad desde preferencias
        initializeDensityMode();
        
        // 2. Iniciar reloj
        startClock();
        
        // 3. Inicializar listeners globales
        initializeGlobalListeners();
        
        // 4. Cargar órdenes desde Firestore (con fallback a localStorage)
        console.log('📡 Conectando con Firebase...');
        
        // Intentar cargar desde localStorage primero (para mostrar algo rápido)
        const localOrders = typeof loadOrdersFromLocalStorage === 'function' ? loadOrdersFromLocalStorage() : [];
        if (localOrders.length > 0) {
            console.log(`📦 Cargando ${localOrders.length} órdenes desde localStorage (respaldo)`);
            state.orders = localOrders;
            renderAllOrders();
        }
        
        const unsubscribe = await loadOrdersFromFirestore(async (orders) => {
            try {
                console.log(`📦 Órdenes recibidas: ${orders.length}`);
                
                // Solo actualizar si las órdenes realmente cambiaron (comparación rápida)
                const currentLength = state.orders.length;
                const newLength = orders.length;
                let ordersChanged = currentLength !== newLength;
                
                if (!ordersChanged && currentLength > 0) {
                    // Comparación rápida por IDs y campos clave
                    for (let i = 0; i < Math.min(currentLength, newLength); i++) {
                        const current = state.orders[i];
                        const updated = orders[i];
                        if (current.id !== updated.id || 
                            current.po !== updated.po || 
                            current.status !== updated.status ||
                            current.part !== updated.part) {
                            ordersChanged = true;
                            break;
                        }
                    }
                }
                
                // Actualizar estado siempre (incluso si no cambió, para asegurar sincronización)
                state.orders = orders;
                state.unsubscribeFirestore = unsubscribe;
                
                console.log(`✅ Estado actualizado con ${orders.length} órdenes`);
                
                // 5. Verificar y ejecutar migración de campo company si es necesario
                if (orders.length > 0 && typeof checkAndMigrate === 'function') {
                    // Verificar si necesitamos migrar ANTES de hacerlo
                    const needsMigration = typeof hasOrdersWithoutCompany === 'function' && hasOrdersWithoutCompany();
                    const silentMigration = sessionStorage.getItem('migration_notified') === 'true';
                    
                    if (needsMigration) {
                        // Evitar migrar si acabamos de recibir una actualización provocada por nosotros mismos
                        // (o si las órdenes ya vienen corregidas de Firebase)
                        await checkAndMigrate(silentMigration);
                        
                        if (!silentMigration) {
                            sessionStorage.setItem('migration_notified', 'true');
                        }
                    }
                }
                
                // 6. Inicializar sistema de rotación
                if (typeof initializeRotationSystem === 'function') {
                    initializeRotationSystem();
                }
                
        // 7. Cargar preferencias de rotación guardadas
        if (typeof loadRotationPreferences === 'function' && typeof rotationState !== 'undefined') {
            const rotationPrefs = loadRotationPreferences();
            if (rotationPrefs) {
                if (rotationPrefs.intervalDuration) {
                    rotationState.intervalDuration = rotationPrefs.intervalDuration;
                }
                if (rotationPrefs.lastCompanyIndex !== undefined && 
                    rotationPrefs.lastCompanyIndex < rotationState.companies.length) {
                    rotationState.currentCompanyIndex = rotationPrefs.lastCompanyIndex;
                }
                // Iniciar rotación automática si estaba activa
                if (rotationPrefs.isActive && rotationState.companies.length > 1) {
                    setTimeout(() => {
                        if (typeof startRotation === 'function') {
                            startRotation();
                        }
                    }, 500);
                }
            }
        }
        
        // 8. Mostrar hint de doble-click si es primera vez
        showEditHint();
                
                // 8. Renderizar órdenes (siempre, incluso si no cambió)
                console.log('🎨 Llamando a renderAllOrders()...');
                renderAllOrders();
            } catch (error) {
                console.error('❌ Error al procesar órdenes:', error);
            }
        });
        
        // 9. Verificar si hay datos en localStorage para migrar
        if (hasLocalStorageData() && isFirebaseConnected()) {
            console.log('💾 Datos encontrados en localStorage');
            setTimeout(() => {
                showMigrationModal();
            }, 1000);
        }
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar aplicación:', error);
        showNotification({
            type: 'error',
            message: 'Error al inicializar la aplicación'
        });
    }
}

/**
 * Maneja la entrada a modo fullscreen
 */
function enterFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    console.log('🖥️ Modo fullscreen activado');
}

/**
 * Muestra el hint de doble-click para nuevos usuarios
 */
function showEditHint() {
    const hasSeenHint = localStorage.getItem('hasSeenEditHint');
    
    if (!hasSeenHint && state.orders.length > 0) {
        const hint = document.getElementById('editHint');
        
        if (hint) {
            setTimeout(() => {
                hint.classList.add('show');
                
                // Ocultar después de 5 segundos
                setTimeout(() => {
                    hint.classList.remove('show');
                    localStorage.setItem('hasSeenEditHint', 'true');
                }, 5000);
            }, 2000);
        }
    }
}

/**
 * Limpia recursos al cerrar la aplicación
 */
function cleanup() {
    console.log('🧹 Limpiando recursos...');
    
    // Detener reloj
    stopClock();
    
    // Limpiar sistema de rotación
    if (typeof cleanupRotationSystem === 'function') {
        cleanupRotationSystem();
    }
    
    // Desconectar Firestore
    if (state.unsubscribeFirestore) {
        state.unsubscribeFirestore();
    }
    
    disconnectFirestore();
    
    // Limpiar listeners
    cleanupGlobalListeners();
    
    console.log('✅ Recursos limpiados');
}

/**
 * Maneja errores globales no capturados
 */
window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
});

/**
 * Maneja promesas rechazadas no capturadas
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promesa rechazada:', event.reason);
});

/**
 * Ejecutar cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Cleanup al cerrar/recargar la página
 */
window.addEventListener('beforeunload', cleanup);

// Log de versión
console.log('%c SMV Dashboard v4.0 - Modular Architecture ', 'background: #001a1f; color: #00d9ff; font-weight: bold; padding: 10px;');
console.log('%c Firebase Firestore Enabled ', 'background: #0a2a1a; color: #00ff88; font-weight: bold; padding: 5px;');
