/**
 * Rotation Manager Module
 * Maneja la rotación automática entre compañías
 */

/**
 * Estado del sistema de rotación
 */
const rotationState = {
    /** @type {boolean} Rotación activa/pausada */
    isActive: false,
    
    /** @type {number} Índice actual en el array de compañías */
    currentCompanyIndex: 0,
    
    /** @type {string[]} Lista de compañías únicas con órdenes */
    companies: [],
    
    /** @type {number|null} ID del interval para el timer */
    intervalId: null,
    
    /** @type {number} Duración del intervalo en ms */
    intervalDuration: 15000,
    
    /** @type {number} Tiempo restante en ms */
    timeRemaining: 15000,
    
    /** @type {number|null} Timestamp del último tick */
    lastTickTime: null,
    
    /** @type {boolean} Indica si la rotación está visible */
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
    
    // Ajustar índice si es necesario
    if (rotationState.currentCompanyIndex >= rotationState.companies.length) {
        rotationState.currentCompanyIndex = Math.max(0, rotationState.companies.length - 1);
    }
    
    // Verificar si cambió la lista de compañías
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
    
    // Actualizar texto del timer (segundos restantes)
    const secondsRemaining = Math.ceil(rotationState.timeRemaining / 1000);
    timerElement.textContent = secondsRemaining;
    
    // Actualizar progreso circular
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
    
    // Actualizar logo y horario de la compañía
    updateCompanyHeader();
}

/**
 * Actualiza el logo y el horario de entrega según la compañía actual
 */
function updateCompanyHeader() {
    // #region agent log
    console.log('[DEBUG] updateCompanyHeader CALLED', {companyConfigExists:typeof COMPANY_CONFIG!=='undefined',companyConfigKeys:typeof COMPANY_CONFIG!=='undefined'?Object.keys(COMPANY_CONFIG):null});
    fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:entry',message:'Function entry',data:{companyConfigExists:typeof COMPANY_CONFIG!=='undefined',companyConfigKeys:typeof COMPANY_CONFIG!=='undefined'?Object.keys(COMPANY_CONFIG):null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch((e)=>{console.error('[DEBUG] Fetch failed:',e);});
    // #endregion
    
    const currentCompany = getCurrentCompany();
    const logoElement = document.getElementById('companyLogo');
    const scheduleElement = document.getElementById('companySchedule');
    
    // #region agent log
    console.log('[DEBUG] After DOM query', {currentCompany,logoElementExists:!!logoElement,scheduleElementExists:!!scheduleElement,companyConfigHasKey:currentCompany&&typeof COMPANY_CONFIG!=='undefined'?COMPANY_CONFIG.hasOwnProperty(currentCompany):false});
    fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:afterDomQuery',message:'After DOM query',data:{currentCompany:currentCompany,logoElementExists:!!logoElement,scheduleElementExists:!!scheduleElement,companyConfigHasKey:currentCompany&&typeof COMPANY_CONFIG!=='undefined'?COMPANY_CONFIG.hasOwnProperty(currentCompany):false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H4,H6'})}).catch(()=>{});
    // #endregion
    
    if (!currentCompany || !COMPANY_CONFIG[currentCompany]) {
        // #region agent log
        console.log('[DEBUG] Early return - no company or config', {currentCompany,hasConfig:currentCompany&&typeof COMPANY_CONFIG!=='undefined'?!!COMPANY_CONFIG[currentCompany]:false});
        fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:earlyReturn',message:'Early return - no company or config',data:{currentCompany:currentCompany,hasConfig:currentCompany&&typeof COMPANY_CONFIG!=='undefined'?!!COMPANY_CONFIG[currentCompany]:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4,H6'})}).catch(()=>{});
        // #endregion
        if (logoElement) logoElement.style.display = 'none';
        if (scheduleElement) scheduleElement.classList.add('hidden');
        return;
    }
    
    const config = COMPANY_CONFIG[currentCompany];
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:configRetrieved',message:'Config retrieved',data:{currentCompany:currentCompany,logo:config.logo,scheduleIsArray:Array.isArray(config.schedule),scheduleLength:config.schedule?config.schedule.length:0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    // Update logo
    if (logoElement && config.logo) {
        logoElement.src = config.logo;
        logoElement.alt = currentCompany;
        logoElement.style.display = 'block';
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:logoUpdated',message:'Logo updated',data:{src:config.logo,alt:currentCompany},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
    } else if (logoElement) {
        logoElement.style.display = 'none';
    }
    
    // Update schedule
    if (scheduleElement) {
        if (config.schedule && Array.isArray(config.schedule) && config.schedule.length > 0) {
            scheduleElement.classList.remove('hidden');
            const timesContainer = scheduleElement.querySelector('.schedule-times');
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:scheduleUpdate',message:'Schedule update attempt',data:{timesContainerExists:!!timesContainer,scheduleArray:config.schedule},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            if (timesContainer) {
                timesContainer.innerHTML = config.schedule
                    .map(time => `<span>${time}</span>`)
                    .join('');
            }
        } else {
            scheduleElement.classList.add('hidden');
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:updateCompanyHeader:scheduleHidden',message:'Schedule hidden',data:{hasSchedule:!!config.schedule,isArray:Array.isArray(config.schedule)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
        }
    }
}

/**
 * Actualiza la visibilidad de los controles de rotación
 */
function updateRotationControlsVisibility() {
    const controlsElement = document.getElementById('rotationControls');
    if (!controlsElement) return;
    
    // Mostrar controles solo si hay más de una compañía
    if (rotationState.companies.length > 1) {
        controlsElement.classList.remove('hidden');
        rotationState.isVisible = true;
    } else {
        controlsElement.classList.add('hidden');
        rotationState.isVisible = false;
        
        // Pausar rotación si está activa
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
    
    // Agregar clase de fade
    colLeft.classList.add('columns-fading');
    colRight.classList.add('columns-fading');
    
    // Remover después de la transición
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
    
    // Actualizar UI
    updateToggleButton();
    
    // Crear interval para actualizar el progreso
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
        
        // Cuando el tiempo se acaba, avanzar a la siguiente compañía
        if (rotationState.timeRemaining === 0) {
            nextCompany();
        }
    }, 100);
    
    // Guardar preferencias
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
    
    // Actualizar UI
    updateToggleButton();
    
    // Guardar preferencias
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
    
    // Avanzar al siguiente índice (circular)
    rotationState.currentCompanyIndex = (rotationState.currentCompanyIndex + 1) % rotationState.companies.length;
    
    console.log(`⏭️ Avanzando a: ${getCurrentCompany()}`);
    
    // Resetear timer
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    // Actualizar UI
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    // Re-renderizar con filtro
    renderAllOrders();
    
    // Guardar preferencias
    saveRotationPreferences();
}

/**
 * Retrocede a la compañía anterior
 */
function previousCompany() {
    if (rotationState.companies.length === 0) return;
    
    // Retroceder al índice anterior (circular)
    rotationState.currentCompanyIndex = (rotationState.currentCompanyIndex - 1 + rotationState.companies.length) % rotationState.companies.length;
    
    console.log(`⏮️ Retrocediendo a: ${getCurrentCompany()}`);
    
    // Resetear timer
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    // Actualizar UI
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    // Re-renderizar con filtro
    renderAllOrders();
    
    // Guardar preferencias
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
    
    // Resetear timer
    rotationState.timeRemaining = rotationState.intervalDuration;
    rotationState.lastTickTime = Date.now();
    
    // Actualizar UI
    updateCompanyDisplay();
    updateProgressIndicator();
    applyTransitionAnimation();
    
    // Re-renderizar con filtro
    renderAllOrders();
    
    // Guardar preferencias
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
    
    // Guardar preferencias
    saveRotationPreferences();
}

/**
 * Inicializa el sistema de rotación
 */
function initializeRotationSystem() {
    console.log('🔄 Inicializando sistema de rotación...');
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:initializeRotationSystem:entry',message:'Initialization started',data:{stateOrdersCount:state?.orders?.length||0,domReady:document.readyState},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
    // #endregion
    
    // Actualizar lista de compañías
    updateCompanyList();
    
    // Actualizar UI
    updateCompanyDisplay();
    updateRotationControlsVisibility();
    updateToggleButton();
    updateProgressIndicator();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/164765ad-565d-458e-821f-c5e98dadf668',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'rotation-manager.js:initializeRotationSystem:exit',message:'Initialization complete',data:{companiesCount:rotationState.companies.length,currentCompanyIndex:rotationState.currentCompanyIndex,currentCompany:getCurrentCompany()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H4'})}).catch(()=>{});
    // #endregion
    
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
