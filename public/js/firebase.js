/**
 * Firebase Firestore Service
 * Maneja todas las operaciones de base de datos en tiempo real
 */

let db = null;
let unsubscribeListener = null;
let isInitialized = false;
let isUpdatingFromFirestore = false;

/**
 * Inicializa Firebase y Firestore
 * @returns {Promise<boolean>} true si se inicializó correctamente
 */
async function initializeFirebase() {
    try {
        // Verificar si Firebase está configurado
        if (!firebaseConfig || firebaseConfig.apiKey === 'TU_API_KEY_AQUI') {
            console.error('❌ Firebase no está configurado. Ver FIREBASE_SETUP.md');
            showFirebaseError('Firebase no está configurado. Por favor, configura tus credenciales en firebase-config.js');
            return false;
        }

        // Verificar que Firebase SDK esté cargado
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK no está cargado');
            showFirebaseError('Firebase SDK no está disponible. Verifica tu conexión a internet.');
            return false;
        }

        // Inicializar Firebase con timeout
        const initPromise = new Promise((resolve, reject) => {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        await Promise.race([
            initPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout inicializando Firebase')), 5000)
            )
        ]);

        // Inicializar Firestore
        db = firebase.firestore();

        // Habilitar persistencia offline (opcional) con timeout
        if (FIRESTORE_CONFIG.enablePersistence) {
            try {
                await Promise.race([
                    db.enablePersistence(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout habilitando persistencia')), 3000)
                    )
                ]);
                console.log('✅ Persistencia offline habilitada');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Persistencia no disponible (múltiples tabs abiertos)');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Persistencia no soportada en este navegador');
                } else if (err.message.includes('Timeout')) {
                    console.warn('⚠️ Timeout habilitando persistencia, continuando sin ella');
                }
            }
        }

        isInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        
        // Verificar si es error de cuota
        const isQuotaError = error.message && (
            error.message.includes('quota') || 
            error.message.includes('Quota') ||
            error.code === 'resource-exhausted' ||
            error.code === 8
        );
        
        if (isQuotaError) {
            showFirebaseError('⚠️ Cuota de Firebase excedida. La app funciona en modo local. Los cambios se guardan en localStorage.', true);
        } else {
            showFirebaseError(`Error al conectar con Firebase: ${error.message}`);
        }
        
        isInitialized = false;
        return false;
    }
}

/**
 * Obtiene la referencia a la colección de órdenes
 * @returns {firebase.firestore.CollectionReference}
 */
function getOrdersCollection() {
    if (!db) {
        throw new Error('Firebase no está inicializado');
    }
    return db.collection(FIRESTORE_CONFIG.collectionName);
}

/**
 * Suscribe a cambios en tiempo real de las órdenes
 * @param {Function} callback - Función que recibe el array de órdenes actualizado
 * @returns {Function} - Función para cancelar la suscripción
 */
function subscribeToOrders(callback) {
    if (!isInitialized) {
        console.error('Firebase no está inicializado');
        return () => {};
    }

    try {
        const ordersRef = getOrdersCollection();
        let isFirstLoad = true;
        
        unsubscribeListener = ordersRef
            .orderBy('order')
            .onSnapshot(
                (snapshot) => {
                    // Prevenir bucles infinitos si ya estamos actualizando
                    if (isUpdatingFromFirestore) {
                        console.log('⏭️ Ignorando actualización (ya procesando)');
                        return;
                    }
                    
                    // Si no es la primera carga y viene de metadata changes, ignorar
                    if (!isFirstLoad && snapshot.metadata.hasPendingWrites) {
                        console.log('⏭️ Ignorando escritura local pendiente');
                        return;
                    }
                    
                    isUpdatingFromFirestore = true;
                    
                    try {
                        const orders = [];
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            orders.push({
                                id: doc.id,
                                ...data
                            });
                        });
                        
                        console.log(`📦 Órdenes sincronizadas: ${orders.length} (primera: ${isFirstLoad})`);
                        callback(orders);
                        
                        if (isFirstLoad) {
                            isFirstLoad = false;
                        }
                    } finally {
                        // Resetear flag después de un breve delay
                        setTimeout(() => {
                            isUpdatingFromFirestore = false;
                        }, 200);
                    }
                },
                (error) => {
                    console.error('❌ Error en listener de Firestore:', error);
                    
                    // Verificar si es error de cuota
                    const isQuotaError = error.message && (
                        error.message.includes('quota') || 
                        error.message.includes('Quota') ||
                        error.code === 'resource-exhausted' ||
                        error.code === 8
                    );
                    
                    if (isQuotaError) {
                        showFirebaseError('⚠️ Cuota de Firebase excedida. La app funciona en modo local. Los cambios se guardan localmente.', true);
                    } else {
                        showFirebaseError(`Error de sincronización: ${error.message}`);
                    }
                    
                    isUpdatingFromFirestore = false;
                }
            );

        return unsubscribeListener;
    } catch (error) {
        console.error('❌ Error al suscribirse a órdenes:', error);
        return () => {};
    }
}

/**
 * Guarda o actualiza una orden en Firestore
 * @param {Object} order - Orden a guardar
 * @param {number} orderIndex - Índice de la orden para mantener el orden
 * @returns {Promise<string>} - ID del documento
 */
async function saveOrderToFirestore(order, orderIndex) {
    if (!isInitialized) {
        throw new Error('Firebase no está inicializado');
    }

    // Marcar que estamos escribiendo
    isUpdatingFromFirestore = true;

    try {
        const ordersRef = getOrdersCollection();
        const orderData = {
            po: order.po || '',
            part: order.part || '',
            qty: order.qty || '0',
            status: order.status || 'process',
            date: order.date || '',
            notes: order.notes || '',
            order: orderIndex,
            company: order.company || 'SUPRAJIT',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (order.id) {
            // Actualizar orden existente
            await ordersRef.doc(order.id).update(orderData);
            console.log(`✅ Orden actualizada: ${order.id}`);
            return order.id;
        } else {
            // Crear nueva orden
            const docRef = await ordersRef.add(orderData);
            console.log(`✅ Orden creada: ${docRef.id}`);
            return docRef.id;
        }
    } catch (error) {
        console.error('❌ Error al guardar orden:', error);
        throw error;
    } finally {
        setTimeout(() => {
            isUpdatingFromFirestore = false;
        }, 300);
    }
}

/**
 * Elimina una orden de Firestore
 * @param {string} orderId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
async function deleteOrderFromFirestore(orderId) {
    if (!isInitialized) {
        throw new Error('Firebase no está inicializado');
    }

    try {
        await getOrdersCollection().doc(orderId).delete();
        console.log(`✅ Orden eliminada: ${orderId}`);
    } catch (error) {
        console.error('❌ Error al eliminar orden:', error);
        throw error;
    }
}

/**
 * Actualiza todas las órdenes en lote (para reordenar)
 * @param {Array} orders - Array de órdenes con IDs
 * @returns {Promise<void>}
 */
async function batchUpdateOrders(orders) {
    if (!isInitialized) {
        throw new Error('Firebase no está inicializado');
    }

    // Marcar que estamos escribiendo para evitar loops del listener
    isUpdatingFromFirestore = true;

    try {
        const batch = db.batch();
        const ordersRef = getOrdersCollection();

        orders.forEach((order, index) => {
            if (order.id) {
                const docRef = ordersRef.doc(order.id);
                batch.update(docRef, {
                    order: index,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();
        console.log(`✅ ${orders.length} órdenes reordenadas`);
    } catch (error) {
        console.error('❌ Error al actualizar lote:', error);
        throw error;
    } finally {
        // Resetear flag después de dar tiempo a Firestore
        setTimeout(() => {
            isUpdatingFromFirestore = false;
        }, 500);
    }
}

/**
 * Importa múltiples órdenes desde localStorage a Firestore
 * @param {Array} orders - Array de órdenes a importar
 * @returns {Promise<number>} - Número de órdenes importadas
 */
async function importOrdersToFirestore(orders) {
    if (!isInitialized) {
        throw new Error('Firebase no está inicializado');
    }

    isUpdatingFromFirestore = true;

    try {
        const batch = db.batch();
        const ordersRef = getOrdersCollection();
        let count = 0;

        orders.forEach((order, index) => {
            const docRef = ordersRef.doc(); // Auto-generar ID
            batch.set(docRef, {
                po: order.po || '',
                part: order.part || '',
                qty: order.qty || '0',
                status: order.status || 'process',
                date: order.date || '',
                notes: order.notes || '',
                company: order.company || 'SUPRAJIT',
                order: index,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            count++;
        });

        await batch.commit();
        console.log(`✅ ${count} órdenes importadas a Firestore`);
        return count;
    } catch (error) {
        console.error('❌ Error al importar órdenes:', error);
        throw error;
    } finally {
        setTimeout(() => {
            isUpdatingFromFirestore = false;
        }, 1000);
    }
}

/**
 * Limpia todas las órdenes de Firestore (útil para testing)
 * @returns {Promise<number>} - Número de órdenes eliminadas
 */
async function clearAllOrders() {
    if (!isInitialized) {
        throw new Error('Firebase no está inicializado');
    }

    try {
        const snapshot = await getOrdersCollection().get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ ${snapshot.size} órdenes eliminadas`);
        return snapshot.size;
    } catch (error) {
        console.error('❌ Error al limpiar órdenes:', error);
        throw error;
    }
}

/**
 * Muestra un error de Firebase en la UI
 * @param {string} message - Mensaje de error
 * @param {boolean} persistent - Si es true, el mensaje no se oculta automáticamente
 */
function showFirebaseError(message, persistent = false) {
    // Remover mensajes anteriores
    const existingError = document.querySelector('.firebase-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'firebase-error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${persistent ? '#2a1f0f' : '#2a0f0f'};
        color: ${persistent ? '#ffa500' : '#ff4757'};
        padding: 1rem 2rem;
        border-radius: 8px;
        border: 2px solid ${persistent ? '#ffa500' : '#ff4757'};
        box-shadow: 0 4px 20px rgba(255, ${persistent ? '165, 0' : '71, 87'}, 0.4);
        z-index: 10000;
        font-weight: 700;
        max-width: 90%;
        text-align: center;
        cursor: ${persistent ? 'pointer' : 'default'};
    `;
    errorDiv.innerHTML = `<i class="fas fa-${persistent ? 'exclamation-circle' : 'exclamation-triangle'}"></i> ${message}`;
    
    if (persistent) {
        errorDiv.onclick = () => errorDiv.remove();
        errorDiv.title = 'Click para cerrar';
    }
    
    document.body.appendChild(errorDiv);

    if (!persistent) {
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
}

/**
 * Desconecta el listener de Firestore
 */
function disconnectFirestore() {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
        console.log('🔌 Desconectado de Firestore');
    }
}

/**
 * Verifica si Firebase está conectado
 * @returns {boolean}
 */
function isFirebaseConnected() {
    return isInitialized;
}
