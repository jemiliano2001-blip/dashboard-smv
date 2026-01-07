/**
 * Export/Import Module
 * Maneja exportación e importación de datos en formato JSON
 */

/**
 * Exporta los datos actuales como JSON
 */
function exportDataToJSON() {
    const dataStr = exportToJSON(state.orders);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    link.href = url;
    
    const date = new Date().toISOString().split('T')[0];
    link.download = `smv-ordenes-${date}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Feedback visual
    const exportBtn = document.querySelector('button[onclick="exportDataToJSON()"]');
    if (exportBtn) {
        const original = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-check"></i> OK';
        setTimeout(() => exportBtn.innerHTML = original, 2000);
    }
    
    console.log('📥 Datos exportados');
}

/**
 * Exporta automáticamente los datos (con throttling)
 */
function autoExportData() {
    const dataStr = exportToJSON(state.orders);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    link.href = url;
    
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    link.download = `smv-ordenes-backup-${date}-${time}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showExportIndicator();
    
    console.log('💾 Auto-exportación realizada');
}

/**
 * Trigger para auto-exportación con throttling
 */
function triggerAutoExport() {
    const now = Date.now();
    
    if (now - state.lastExportTime < AUTO_EXPORT_THROTTLE_MS) {
        console.log('⏱️ Auto-exportación en cooldown');
        return;
    }
    
    state.lastExportTime = now;
    autoExportData();
}

/**
 * Maneja la importación de datos desde un archivo JSON
 * @param {Event} event - Evento del input file
 */
function importDataFromFile(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const orders = importFromJSON(e.target.result);
            
            // Confirmar antes de importar
            const confirmed = confirm(
                `¿Importar ${orders.length} órdenes? Esto reemplazará las órdenes actuales en Firebase.`
            );
            
            if (!confirmed) {
                event.target.value = '';
                return;
            }
            
            // Limpiar órdenes actuales en Firestore (si está disponible)
            if (isFirebaseConnected() && typeof clearAllOrders === 'function') {
                try {
                    await clearAllOrders();
                } catch (error) {
                    console.warn('⚠️ No se pudieron limpiar órdenes en Firebase, continuando con importación');
                }
            }
            
            // Importar nuevas órdenes
            state.orders = orders;
            
            // Guardar en localStorage como respaldo
            if (typeof saveOrdersToLocalStorage === 'function') {
                saveOrdersToLocalStorage(orders);
            }
            
            // Intentar importar a Firestore (si está disponible)
            if (isFirebaseConnected() && typeof importOrdersToFirestore === 'function') {
                try {
                    await importOrdersToFirestore(orders);
                } catch (error) {
                    console.warn('⚠️ No se pudieron importar órdenes a Firebase, guardadas en localStorage:', error);
                }
            }
            
            renderAllOrders();
            
            showNotification({
                type: 'success',
                message: `${orders.length} órdenes importadas correctamente`
            });
            
            console.log(`✅ ${orders.length} órdenes importadas`);
        } catch (error) {
            showNotification({
                type: 'error',
                message: `Error al importar: ${error.message}`
            });
            
            console.error('❌ Error al importar:', error);
        }
    };
    
    reader.onerror = function() {
        showNotification({
            type: 'error',
            message: 'Error al leer el archivo'
        });
    };
    
    reader.readAsText(file);
    
    // Reset input para permitir importar el mismo archivo otra vez
    event.target.value = '';
}

/**
 * Trigger para abrir el selector de archivo de importación
 */
function triggerImportFile() {
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
        fileInput.click();
    }
}

/**
 * Guarda los datos manualmente (sin exportar)
 */
async function saveDataManually() {
    try {
        await saveAllOrders(state.orders);
        
        const saveBtn = document.querySelector('button[onclick="saveDataManually()"]');
        if (saveBtn) {
            const original = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> OK';
            setTimeout(() => saveBtn.innerHTML = original, 1000);
        }
        
        showNotification({
            type: 'success',
            message: 'Datos guardados exitosamente'
        });
        
        console.log('💾 Datos guardados manualmente');
    } catch (error) {
        showNotification({
            type: 'error',
            message: 'Error al guardar datos'
        });
        
        console.error('❌ Error al guardar:', error);
    }
}
