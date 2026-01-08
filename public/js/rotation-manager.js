/**
 * Rotation Manager Module
 * Maneja la rotación automática entre compañías
 */

const rotationState = {
    isActive: false,
    currentCompanyIndex: 0,
    companies: [],
    intervalId: null,
    intervalDuration: 15000,
    timeRemaining: 15000,
    lastTickTime: null,
    isVisible: false
};

/**
 * Extrae las compañías únicas de las órdenes actuales
 * @returns {string[]} Array de compañías únicas ordenadas alfabéticamente
 */
function getUniqueCompanies() {
    const companiesSet = new Set();
    
    state.orders.forEach(order => {
        if (order.company && order.company.trim() !== '') {
            companiesSet.add(order.company.trim().toUpperCase());
        }
    });
    
    return Array.from(companiesSet).sort();
}

/**
 * Filtra órdenes por compañía
 * @param {string} company - Nombre de la compañía
 * @returns {Object[]} Array de órdenes filtradas
 */
function filterOrdersByCompany(company) {
    if (!company) return state.orders;
    
    return state.orders.filter(order => 
        order.company && order.company.trim().toUpperCase() === company.toUpperCase()
    );
}

/**
 * Obtiene la compañía actual
 * @returns {string|null} Nombre de la compañía actual o null
 */
function getCurrentCompany() {
    if (rotationState.companies.length === 0) return null;
    return rotationState.companies[rotationState.currentCompanyIndex];
}

/**
 * Actualiza la lista de compañías disponibles
 */
function updateCompanyList() {
    const previousCompanies = [...rotationState.companies];
    rotationState.companies = getUniqueCompanies();
    
    if (rotationState.currentCompanyIndex >= rotationState.companies.length) {
        rotationState.currentCompanyIndex = Math.max(0, rotationState.companies.length - 1);
    }
    
    const companiesChanged = JSON.stringify(previousCompanies) !== JSON.stringify(rotationState.companies);
    
    if (companiesChanged) {
        console.log(`📊 Compañías actualizadas: ${rotationState.companies.join(', ')}`);
    }
    
    return companiesChanged;
}

/**
 * Actualiza el indicador de progreso circular
 */
function updateProgressIndicator() {
    const timerElement = document.getElementById('rotationTimer');
    const progressCircle = document.querySelector('.progress-ring-circle');
    
    if (!timerElement || !progressCircle) return;
    
    const secondsRemaining = Math.ceil(rotationState.timeRemaining / 1000);
    timerElement.textContent = secondsRemaining;
    
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const progress = 1 - (rotationState.timeRemaining / rotationState.intervalDuration);
    const offset = circumference * (1 - progress);
    
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
}

/**
 * Actualiza la visualización del header con la compañía actual
 */
function updateCompanyDisplay() {
    const companyElement = document.getElementById('currentCompany');
    const paginationElement = document.getElementById('companyPagination');
    
    if (!companyElement || !paginationElement) return;
    
    const currentCompany = getCurrentCompany();
    const totalCompanies = rotationState.companies.length;
    const currentIndex = rotationState.currentCompanyIndex + 1;
    
    if (currentCompany) {
        companyElement.textContent = currentCompany;
        paginationElement.textContent = `${currentIndex} de ${totalCompanies}`;
    } else {
        companyElement.textContent = 'SIN COMPAÑÍA';
        paginationElement.textContent = '0 de 0';
    }
    
    updateCompanyHeader();
}

/**
 * Actualiza el logo y el horario de entrega según la compañía actual
 */
function updateCompanyHeader() {
    const currentCompany = getCurrentCompany();
    const logoElement = document.getElementById('companyLogo');
    const scheduleElement = document.getElementById('companySchedule');
    
    if (!currentCompany || typeof COMPANY_CONFIG === 'undefined' || !COMPANY_CONFIG[currentCompany]) {
        if (logoElement) logoElement.style.display = 'none';
        if (scheduleElement) scheduleElement.classList.add('hidden');
        return;
    }
    
    const config = COMPANY_CONFIG[currentCompany];
    
    if (logoElement && config.logo) {
        logoElement.src = config.logo;
        logoElement.alt = currentCompany;
        logoElement.style.display = 'block';
    } else if (logoElement) {
        logoElement.style.display = 'none';
    }
    
    if (scheduleElement) {
        if (config.schedule && Array.isArray(config.schedule) && config.schedule.length > 0) {
            scheduleElement.classList.remove('hidden');
            const timesContainer = scheduleElement.querySelector('.schedule-times');
            if (timesContainer) {
                timesContainer.innerHTML = config.schedule
                    .map(time => `<span>${time}</span>`)
                    .join('');
            }
        } else {
            scheduleElement.classList.add('hidden');
        }
    }
}

/**
 * Actualiza la visibilidad de los controles de rotación
 */
function updateRotationControlsVisibility() {
    const controlsElement = document.getElementById('rotationControls');
    if (!controlsElement) return;
    
    if (rotationState.companies.length > 1) {
        controlsElement.classList.remove('hidden');
        rotationState.isVisible = true;
    } else {
        controlsElement.classList.add('hidden');
        rotationState.isVisible = false;
        
        if (rotationState.isActive) {
            pauseRotation();
        }
    }
}

/**
 * Actualiza el botón de play/pause
 */
function updateToggleButton() {
    const toggleButton = document.getElementById('rotationToggle');
    if (!toggleButton) return;
    
    const icon = toggleButton.querySelector('i');
    if (!icon) return;
    
    if (rotationState.isActive) {
        icon.className = 'fas fa-pause';
        toggleButton.classList.add('active');
        toggleButton.title = 'Pausar rotación';
    } else {
        icon.className = 'fas fa-play';
        toggleButton.classList.remove('active');
        toggleButton.title = 'Iniciar rotación';
    }
}

/**
 * Aplica animación de transición a las columnas
 */
function applyTransitionAnimation() {
    const colLeft = document.getElementById('colLeft');
    const colRight = document.getElementById('colRight');
    
    if (!colLeft || !colRight) return;
    
    colLeft.classList.add('columns-fading');
    colRight.classList.add('columns-fading');
    
    setTimeout(() => {
        colLeft.classList.remove('columns-fading');
        colRight.classList.remove('columns-fading');
    }, 300);
}

/**
 * Inicia la rotación automática
 */
function startRotation() {
    if (rotationState.intervalId) return;
    if (rotationState.companies.length <= 1) {
        console.log('⚠️ No hay suficientes compañías para rotar');
        return;
    }
    
    rotationState.isActive = true;
    rotationState.lastTickTime = Date.now();
    rotationState.timeRemaining = rotationState.intervalDuration;
    
    console.log('▶️ Rotación automática iniciada');
    
    updateToggleButton();
    
    rotationState.intervalId = setInterval(() => {
        if (!rotationState.isActive) {
            clearInterval(rotationState.intervalId);
            rotationState.intervalId = null;
            return;
        }
        
        const now = Date.now();
        const elapsed = now - rotationState.lastTickTime;
        rotationState.timeRemaining = Math.max(0, rotationState.timeRemaining - elapsed);
        rotationState.lastTickTime = now;
        
        updateProgressIndicator();
        
        if (rotationState.timeRemaining === 0) {
            nextCompany();
        }
    }, 100);
    
    saveRotationPreferences();
}

/**
 * Pausa la rotación automática
 */
function pauseRotation() {
    if (!rotationState.isActive) return;
    
    rotationState.isActive = false;
    
    if (rotationState.intervalId) {
        clearInterval(rotationState.intervalId);
        rotationState.intervalId = null;
    }
    
    console.log('⏸️ Rotación automática pausada');
    
    updateToggleButton();
    
    saveRotationPreferences();
}

/**
 * Alterna entre iniciar y pausar la rotación
 */
function toggleRotation() {
    if (rotationState.isActive) {
        pauseRotation();
    } else {
        startRotation();
    }
}

/**
 * Avanza a la siguiente compañía
 */
function nextCompany() {
    if (rotationState.companies.length === 0) return;
    
    rotationState.currentCompanyIndex = (rotationState.currentCompanyIndex + 1) % rotationState.companies.length;
    
    console.log(`⏭️ Avanzando a: ${getCurrentCompany()}`);
    
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    renderAllOrders();
    
    saveRotationPreferences();
}

/**
 * Retrocede a la compañía anterior
 */
function previousCompany() {
    if (rotationState.companies.length === 0) return;
    
    rotationState.currentCompanyIndex = (rotationState.currentCompanyIndex - 1 + rotationState.companies.length) % rotationState.companies.length;
    
    console.log(`⏮️ Retrocediendo a: ${getCurrentCompany()}`);
    
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    renderAllOrders();
    
    saveRotationPreferences();
}

/**
 * Salta a una compañía específica por índice
 * @param {number} index - Índice de la compañía
 */
function goToCompany(index) {
    if (index < 0 || index >= rotationState.companies.length) {
        console.warn(`⚠️ Índice de compañía inválido: ${index}`);
        return;
    }
    
    rotationState.currentCompanyIndex = index;
    
    console.log(`🎯 Saltando a: ${getCurrentCompany()}`);
    
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    renderAllOrders();
    
    saveRotationPreferences();
}

/**
 * Actualiza el intervalo de rotación
 * @param {number} duration - Nueva duración en milisegundos
 */
function updateRotationInterval(duration) {
    const newDuration = parseInt(duration, 10);
    
    if (isNaN(newDuration) || newDuration < 1000) {
        console.warn('⚠️ Duración inválida, debe ser al menos 1000ms');
        return;
    }
    
    rotationState.intervalDuration = newDuration;
    rotationState.timeRemaining = newDuration;
    
    console.log(`⏱️ Intervalo de rotación actualizado a ${newDuration / 1000}s`);
    
    saveRotationPreferences();
}

/**
 * Inicializa el sistema de rotación
 */
function initializeRotationSystem() {
    console.log('🔄 Inicializando sistema de rotación...');
    
    updateCompanyList();
    
    updateCompanyDisplay();
    updateRotationControlsVisibility();
    updateToggleButton();
    updateProgressIndicator();
    
    console.log(`✅ Sistema de rotación inicializado con ${rotationState.companies.length} compañía(s)`);
}

/**
 * Limpia recursos del sistema de rotación
 */
function cleanupRotationSystem() {
    if (rotationState.intervalId) {
        clearInterval(rotationState.intervalId);
        rotationState.intervalId = null;
    }
    
    rotationState.isActive = false;
    
    console.log('🧹 Sistema de rotación limpiado');
}
