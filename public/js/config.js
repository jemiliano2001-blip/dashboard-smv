/**
 * Application Configuration
 * Constantes y configuración global de la aplicación
 */

/**
 * @typedef {Object} StatusOption
 * @property {string} code - Código del estatus
 * @property {string} label - Etiqueta visible del estatus
 * @property {string} class - Clase CSS para el badge
 */

/**
 * Opciones de estatus disponibles para las órdenes
 * @type {StatusOption[]}
 */
const statusOptions = [
    { code: 'process', label: 'MAQ', class: 'bg-process' },
    { code: 'heat', label: 'TEMP', class: 'bg-heat' },
    { code: 'qc', label: 'CAL', class: 'bg-qc' },
    { code: 'partial', label: 'PARC', class: 'bg-partial' },
    { code: 'done', label: 'OK', class: 'bg-done' },
    { code: 'invoiced', label: 'FACT', class: 'bg-invoiced' },
    { code: 'hold', label: 'PARO', class: 'bg-hold' }
];

/**
 * Configuración de auto-exportación
 */
const EXPORT_CONFIG = {
    throttleMs: 180000, // 3 minutos
    enabled: true
};

/**
 * Configuración de localStorage
 * Solo se usa para preferencias UI (densidad)
 */
const LOCALSTORAGE_KEYS = {
    density: 'smv_density_compact',
    legacyOrders: 'smv_dash_v3_1' // Para migración desde versión anterior
};

/**
 * Genera datos de ejemplo para testing
 * @param {number} count - Número de órdenes de ejemplo a generar
 * @returns {Array} Array de órdenes de ejemplo
 */
function generateSampleData(count = 4) {
    const samples = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        
        samples.push({
            po: `2074${i + 2}`,
            part: `PZA-TEST-${i + 1}`,
            qty: `${50 * (i + 1)}`,
            status: 'process',
            date: `${day}/${month}/${year}`,
            notes: 'Iniciando...'
        });
    }
    
    return samples;
}

/**
 * Días de la semana en español
 */
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Meses en español
 */
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
