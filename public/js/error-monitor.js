/**
 * Error Monitoring System
 * Captures and contextualizes JavaScript runtime errors for AI analysis
 */

const errorMonitor = {
    errorHistory: [],
    maxHistorySize: 10,
    lastErrorTime: 0,
    debounceMs: 5000,
    userActions: [],
    maxActionsTracked: 5,
    
    /**
     * Initialize error monitoring
     */
    init() {
        this.trackUserActions();
        console.log('🔍 Error Monitor initialized');
    },
    
    /**
     * Track user interactions for context
     */
    trackUserActions() {
        const actions = ['click', 'dblclick', 'keydown', 'submit'];
        
        actions.forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                this.logUserAction(eventType, e);
            }, true);
        });
    },
    
    /**
     * Log user action
     */
    logUserAction(type, event) {
        const action = {
            type,
            timestamp: Date.now(),
            target: this.getElementDescription(event.target),
            key: event.key || null
        };
        
        this.userActions.push(action);
        
        if (this.userActions.length > this.maxActionsTracked) {
            this.userActions.shift();
        }
    },
    
    /**
     * Get readable element description
     */
    getElementDescription(element) {
        if (!element) return 'unknown';
        
        const tag = element.tagName?.toLowerCase() || 'unknown';
        const id = element.id ? `#${element.id}` : '';
        const classes = element.className ? `.${element.className.split(' ')[0]}` : '';
        const text = element.textContent?.substring(0, 30) || '';
        
        return `${tag}${id}${classes}${text ? ` "${text}..."` : ''}`;
    },
    
    /**
     * Capture and analyze error
     */
    async captureError(errorData) {
        const now = Date.now();
        
        // Debounce duplicate errors
        if (now - this.lastErrorTime < this.debounceMs) {
            const lastError = this.errorHistory[this.errorHistory.length - 1];
            if (lastError && lastError.message === errorData.message) {
                console.log('🔕 Duplicate error suppressed');
                return;
            }
        }
        
        this.lastErrorTime = now;
        
        // Build comprehensive error context
        const errorContext = this.buildErrorContext(errorData);
        
        // Store in history
        this.errorHistory.push(errorContext);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        
        console.log('❌ Error captured:', errorContext);
        
        // Show AI error assistant
        if (typeof showErrorAssistant === 'function') {
            await showErrorAssistant(errorContext);
        }
    },
    
    /**
     * Build comprehensive error context
     */
    buildErrorContext(errorData) {
        const { message, error, filename, lineno, colno, promise } = errorData;
        
        return {
            // Error details
            type: promise ? 'UnhandledRejection' : 'RuntimeError',
            message: message || error?.message || 'Unknown error',
            stack: this.sanitizeStackTrace(error?.stack || ''),
            filename: this.sanitizeFilename(filename),
            line: lineno,
            column: colno,
            
            // Application state
            state: this.captureApplicationState(),
            
            // Recent user actions
            recentActions: this.formatRecentActions(),
            
            // Environment info
            environment: this.captureEnvironment(),
            
            // Timestamp
            timestamp: new Date().toISOString(),
            
            // Raw error for debugging
            rawError: error
        };
    },
    
    /**
     * Sanitize stack trace (remove full paths, keep relative)
     */
    sanitizeStackTrace(stack) {
        if (!stack) return 'No stack trace available';
        
        return stack
            .split('\n')
            .slice(0, 10) // Limit stack depth
            .map(line => {
                // Remove full file paths, keep only filename
                return line.replace(/https?:\/\/[^\/]+\//g, '')
                          .replace(/file:\/\/\/.*?\/([^\/]+\.js)/g, '$1')
                          .replace(/C:\\.*?\\([^\\]+\.js)/g, '$1');
            })
            .join('\n');
    },
    
    /**
     * Sanitize filename
     */
    sanitizeFilename(filename) {
        if (!filename) return 'unknown';
        return filename.replace(/^.*[\/\\]/, '');
    },
    
    /**
     * Capture current application state
     */
    captureApplicationState() {
        const state = {
            totalOrders: 0,
            editMode: false,
            currentView: 'all',
            densityMode: 'normal'
        };
        
        try {
            if (typeof getOrdersCount === 'function') {
                state.totalOrders = getOrdersCount();
            }
            
            if (typeof isEditingMode === 'function') {
                state.editMode = isEditingMode();
            }
            
            if (typeof isCompactMode === 'function') {
                state.densityMode = isCompactMode() ? 'compact' : 'normal';
            }
            
            if (typeof rotationState !== 'undefined' && rotationState.companies) {
                const currentCompany = rotationState.companies[rotationState.currentCompanyIndex];
                state.currentView = currentCompany || 'all';
            }
        } catch (e) {
            console.warn('Could not capture full application state:', e);
        }
        
        return state;
    },
    
    /**
     * Format recent user actions for readability
     */
    formatRecentActions() {
        return this.userActions.map(action => {
            const timeAgo = Math.round((Date.now() - action.timestamp) / 1000);
            return `${timeAgo}s ago: ${action.type} on ${action.target}${action.key ? ` (key: ${action.key})` : ''}`;
        });
    },
    
    /**
     * Capture environment information
     */
    captureEnvironment() {
        return {
            userAgent: navigator.userAgent,
            browser: this.getBrowserInfo(),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            url: window.location.href,
            online: navigator.onLine
        };
    },
    
    /**
     * Get simplified browser info
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    },
    
    /**
     * Get error history
     */
    getHistory() {
        return this.errorHistory;
    },
    
    /**
     * Clear error history
     */
    clearHistory() {
        this.errorHistory = [];
        console.log('🧹 Error history cleared');
    }
};

/**
 * Global error handler
 */
async function handleRuntimeError(errorData) {
    await errorMonitor.captureError(errorData);
}

// Global error handlers - catch all runtime errors
window.onerror = function(message, source, lineno, colno, error) {
    handleRuntimeError({
        message,
        error,
        filename: source,
        lineno,
        colno,
        promise: false
    });
    return false; // Allow default browser handling too
};

window.onunhandledrejection = function(event) {
    handleRuntimeError({
        message: event.reason?.message || String(event.reason),
        error: event.reason,
        filename: 'Promise',
        lineno: 0,
        colno: 0,
        promise: true
    });
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => errorMonitor.init());
} else {
    errorMonitor.init();
}
