/**
 * Clock Module
 * Maneja el reloj y fecha en tiempo real
 */

let clockInterval = null;

/**
 * Inicia el reloj
 */
function startClock() {
    updateClock(); // Actualizar inmediatamente
    
    clockInterval = setInterval(updateClock, 1000);
    
    console.log('🕐 Reloj iniciado');
}

/**
 * Actualiza el reloj y la fecha en el DOM
 */
function updateClock() {
    const now = new Date();
    
    // Actualizar reloj
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const timeString = now.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
        clockElement.innerText = timeString;
    }
    
    // Actualizar fecha
    const dateElement = document.getElementById('date');
    if (dateElement) {
        const dateString = now.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        }).toUpperCase();
        dateElement.innerText = dateString;
    }
}

/**
 * Detiene el reloj
 */
function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
        console.log('🛑 Reloj detenido');
    }
}
