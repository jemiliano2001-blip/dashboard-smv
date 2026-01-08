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
 * Company configuration with logos and delivery schedules
 * @type {Object.<string, {logo: string, schedule: string[]|null}>}
 */
const COMPANY_CONFIG = {
    'SUPRAJIT': {
        logo: 'assets/images/logo-suprajit.png',
        schedule: ['9:00 - 11:00', '2:00 - 2:45', '3:20 - 4:00']
    },
    'AFX INDUSTRIES': {
        logo: 'assets/images/logo-afx.png',
        schedule: null
    },
    'FISHER': {
        logo: 'assets/images/logo-fisher.png',
        schedule: null
    },
    'SILICONE TECHNOLOGIES': {
        logo: 'assets/images/logo-silicone.png',
        schedule: null
    },
    'OHD OPERATORS DE MEXICO': {
        logo: 'assets/images/logo-ohd.png',
        schedule: null
    },
    'KOHLER REYNOSA': {
        logo: 'assets/images/logo-kohler.png',
        schedule: null
    },
    'SENSATA TECHNOLOGIES': {
        logo: 'assets/images/logo-sensata.png',
        schedule: null
    },
    'DECOFIMEX': {
        logo: 'assets/images/logo-decofimex.png',
        schedule: null
    },
    'SYPRESS': {
        logo: 'assets/images/logo-sypress.png',
        schedule: null
    },
    'CONTROLES TEMEX': {
        logo: 'assets/images/logo-temex.png',
        schedule: null
    },
    'CONTROLES LATINOAMERICANAS': {
        logo: 'assets/images/logo-latinoamericanas.png',
        schedule: null
    },
    'BULK PACK': {
        logo: 'assets/images/logo-bulkpack.png',
        schedule: null
    },
    'TERMOFORMADOS': {
        logo: 'assets/images/logo-termoformados.png',
        schedule: null
    },
    'MECALUX': {
        logo: 'assets/images/logo-mecalux.png',
        schedule: null
    }
};

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

/**
 * AI Error Assistant Configuration
 */
const AI_CONFIG = {
    provider: 'gemini',
    model: 'gemini-2.5-flash', // Recommended model (June 2025+)
    enabled: true, // Set to false to disable AI error analysis
    maxRetries: 2,
    timeout: 15000 // 15 seconds
};
