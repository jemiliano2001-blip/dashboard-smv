/**
 * Formatters & Utilities
 * Funciones de formateo y utilidades generales
 */

/**
 * Formatea un número de PO agregando el prefijo "SO"
 * @param {string|number} po - Número de PO
 * @returns {string} PO formateado con prefijo "SO"
 */
function formatPO(po) {
    if (!po) return 'SO';
    
    const poStr = String(po).trim();
    
    // Si ya tiene el prefijo SO, retornarlo tal cual
    if (poStr.toUpperCase().startsWith('SO')) {
        return poStr.toUpperCase();
    }
    
    // Agregar prefijo SO
    return 'SO' + poStr;
}

/**
 * Normaliza un PO removiendo el prefijo "SO" para almacenamiento
 * @param {string|number} po - PO a normalizar
 * @returns {string} PO sin prefijo
 */
function normalizePO(po) {
    if (!po) return '';
    
    const poStr = String(po).trim().toUpperCase();
    
    // Remover prefijo SO si existe
    return poStr.startsWith('SO') ? poStr.substring(2) : poStr;
}

/**
 * Genera una fecha en formato dd/mm/yy
 * @param {Date} [date] - Fecha a formatear (por defecto: hoy)
 * @returns {string} Fecha formateada
 */
function formatDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
}

/**
 * Obtiene la clase CSS para un código de estatus
 * @param {string} code - Código de estatus
 * @returns {string} Clase CSS
 */
function getStatusClass(code) {
    const option = statusOptions.find(o => o.code === code);
    return option ? option.class : '';
}

/**
 * Obtiene la etiqueta visible para un código de estatus
 * @param {string} code - Código de estatus
 * @returns {string} Etiqueta del estatus
 */
function getStatusLabel(code) {
    const option = statusOptions.find(o => o.code === code);
    return option ? option.label : code.toUpperCase();
}

/**
 * Obtiene el siguiente estatus en el ciclo
 * @param {string} currentCode - Código de estatus actual
 * @returns {string} Código del siguiente estatus
 */
function getNextStatus(currentCode) {
    const currentIndex = statusOptions.findIndex(o => o.code === currentCode);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    return statusOptions[nextIndex].code;
}

/**
 * Formatea la hora en formato HH:MM
 * @param {Date} [date] - Fecha con hora (por defecto: ahora)
 * @returns {string} Hora formateada
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatea la fecha larga en español
 * @param {Date} [date] - Fecha (por defecto: hoy)
 * @returns {string} Fecha formateada (ej: "LUNES, 01 ENERO")
 */
function formatLongDate(date = new Date()) {
    const dayName = DAYS_ES[date.getDay()];
    const day = date.getDate();
    const monthName = MONTHS_ES[date.getMonth()];
    
    return `${dayName.toUpperCase()}, ${String(day).padStart(2, '0')} ${monthName.toUpperCase()}`;
}

/**
 * Valida si una cadena es un PO válido
 * @param {string} po - PO a validar
 * @returns {boolean} true si es válido
 */
function isValidPO(po) {
    if (!po) return false;
    const normalized = normalizePO(po);
    return normalized.length > 0 && /^[A-Z0-9]+$/i.test(normalized);
}

/**
 * Valida si una cantidad es válida
 * @param {string|number} qty - Cantidad a validar
 * @returns {boolean} true si es válida
 */
function isValidQuantity(qty) {
    if (!qty) return false;
    const num = parseInt(qty, 10);
    return !isNaN(num) && num >= 0;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
