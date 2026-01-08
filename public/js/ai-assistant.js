/**
 * AI Error Assistant
 * Integrates with Google Gemini API to analyze errors and provide fix suggestions
 */

const aiAssistant = {
    genAI: null,
    model: null,
    isInitialized: false,
    isAnalyzing: false,
    
    /**
     * Initialize Gemini AI
     */
    init() {
        try {
            // Check if API key is configured
            if (!firebaseConfig.geminiApiKey) {
                console.warn('⚠️ Gemini API key not configured in firebase-config.js');
                return false;
            }
            
            // Check if Gemini SDK is loaded
            if (typeof google === 'undefined' || !google.generativeai) {
                console.error('❌ Gemini SDK not loaded. Make sure the script is included.');
                return false;
            }
            
            // Initialize Gemini
            this.genAI = google.generativeai.getGenerativeModel({
                apiKey: firebaseConfig.geminiApiKey,
                model: AI_CONFIG.model
            });
            
            this.isInitialized = true;
            console.log('🤖 AI Assistant initialized with Gemini', AI_CONFIG.model);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize AI Assistant:', error);
            return false;
        }
    },
    
    /**
     * Analyze error and get AI suggestions
     */
    async analyzeError(errorContext) {
        if (!AI_CONFIG.enabled) {
            console.log('⚠️ AI Assistant is disabled in config');
            return null;
        }
        
        // Lazy init if not already initialized
        if (!this.isInitialized) {
            const initSuccess = this.init();
            if (!initSuccess) {
                return {
                    error: 'AI Assistant not properly configured. Please add your Gemini API key to firebase-config.js',
                    setupInstructions: 'Get your free API key at https://aistudio.google.com/apikey'
                };
            }
        }
        
        if (this.isAnalyzing) {
            console.log('⏳ Analysis already in progress...');
            return null;
        }
        
        this.isAnalyzing = true;
        
        try {
            const prompt = this.formatPrompt(errorContext);
            
            console.log('🤖 Sending error to AI for analysis...');
            
            const result = await Promise.race([
                this.genAI.generateContent(prompt),
                this.timeout(AI_CONFIG.timeout)
            ]);
            
            const response = await result.response;
            const text = response.text();
            
            console.log('✅ AI analysis received');
            
            return this.parseAIResponse(text);
            
        } catch (error) {
            console.error('❌ AI analysis failed:', error);
            
            // Handle specific error types
            if (error.message?.includes('API_KEY')) {
                return {
                    error: 'Invalid API key. Please check your Gemini API key in firebase-config.js',
                    setupInstructions: 'Get a new API key at https://aistudio.google.com/apikey'
                };
            }
            
            if (error.message?.includes('quota')) {
                return {
                    error: 'API quota exceeded. Please try again later or upgrade your plan.',
                    setupInstructions: 'Check your usage at https://aistudio.google.com/'
                };
            }
            
            if (error.message === 'Timeout') {
                return {
                    error: 'AI analysis timed out. Please try again.',
                    retryable: true
                };
            }
            
            return {
                error: `AI analysis failed: ${error.message}`,
                retryable: true
            };
            
        } finally {
            this.isAnalyzing = false;
        }
    },
    
    /**
     * Format error context into AI prompt
     */
    formatPrompt(errorContext) {
        return `You are an expert JavaScript debugging assistant for a production dashboard application.

APPLICATION CONTEXT:
- Name: SMV Dashboard - TV Production Order Management System
- Purpose: Manufacturing dashboard displaying production orders in real-time
- Tech Stack: Vanilla JavaScript, Firebase Firestore, Material Design
- Users: Factory floor workers viewing on TV screens

ERROR DETAILS:
Type: ${errorContext.type}
Message: ${errorContext.message}
File: ${errorContext.filename}:${errorContext.line}:${errorContext.column}

STACK TRACE:
${errorContext.stack}

APPLICATION STATE:
- Total Orders: ${errorContext.state.totalOrders}
- Edit Mode: ${errorContext.state.editMode}
- Current View: ${errorContext.state.currentView}
- Density Mode: ${errorContext.state.densityMode}

RECENT USER ACTIONS:
${errorContext.recentActions.join('\n') || 'No recent actions recorded'}

ENVIRONMENT:
- Browser: ${errorContext.environment.browser}
- Viewport: ${errorContext.environment.viewport}
- Online: ${errorContext.environment.online}

TASK:
Analyze this error and provide:

1. ROOT CAUSE (1-2 sentences max)
2. FIX STEPS (3-5 specific, actionable steps)
3. CODE SNIPPET (if applicable, show corrected code)
4. PREVENTION (1-2 sentences on how to prevent similar errors)

Keep your response concise, technical, and actionable. Format your response exactly as:

ROOT CAUSE:
[Your analysis here]

FIX STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]

CODE SNIPPET:
\`\`\`javascript
// Corrected code here (if applicable)
\`\`\`

PREVENTION:
[Prevention advice here]`;
    },
    
    /**
     * Parse AI response into structured format
     */
    parseAIResponse(text) {
        try {
            const sections = {
                rootCause: '',
                fixSteps: [],
                codeSnippet: '',
                prevention: ''
            };
            
            // Extract root cause
            const rootCauseMatch = text.match(/ROOT CAUSE:[\s\n]+(.*?)(?=FIX STEPS:|$)/is);
            if (rootCauseMatch) {
                sections.rootCause = rootCauseMatch[1].trim();
            }
            
            // Extract fix steps
            const fixStepsMatch = text.match(/FIX STEPS:[\s\n]+(.*?)(?=CODE SNIPPET:|PREVENTION:|$)/is);
            if (fixStepsMatch) {
                const stepsText = fixStepsMatch[1].trim();
                sections.fixSteps = stepsText
                    .split(/\n/)
                    .filter(line => /^\d+\./.test(line.trim()))
                    .map(line => line.replace(/^\d+\.\s*/, '').trim());
            }
            
            // Extract code snippet
            const codeMatch = text.match(/```(?:javascript)?\n(.*?)```/is);
            if (codeMatch) {
                sections.codeSnippet = codeMatch[1].trim();
            }
            
            // Extract prevention
            const preventionMatch = text.match(/PREVENTION:[\s\n]+(.*?)$/is);
            if (preventionMatch) {
                sections.prevention = preventionMatch[1].trim();
            }
            
            // Fallback: if structured parsing failed, return raw text
            if (!sections.rootCause && !sections.fixSteps.length) {
                return {
                    rootCause: 'See full analysis below',
                    fixSteps: ['See full analysis below'],
                    codeSnippet: '',
                    prevention: text,
                    rawResponse: text
                };
            }
            
            return sections;
            
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return {
                rootCause: 'Failed to parse AI response',
                fixSteps: ['See raw response below'],
                codeSnippet: '',
                prevention: '',
                rawResponse: text
            };
        }
    },
    
    /**
     * Timeout helper
     */
    timeout(ms) {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), ms)
        );
    }
};

/**
 * Show error assistant modal with AI analysis
 */
async function showErrorAssistant(errorContext) {
    const modal = document.getElementById('errorAssistantModal');
    if (!modal) {
        console.error('Error assistant modal not found in DOM');
        return;
    }
    
    // Populate error details
    const errorMessage = modal.querySelector('.error-message');
    const errorStack = modal.querySelector('.error-stack');
    
    if (errorMessage) {
        errorMessage.innerHTML = `
            <strong>${errorContext.type}:</strong> ${errorContext.message}
            <br>
            <small style="opacity: 0.7;">${errorContext.filename}:${errorContext.line}:${errorContext.column}</small>
        `;
    }
    
    if (errorStack) {
        errorStack.innerHTML = `
            <details style="margin-top: 8px;">
                <summary style="cursor: pointer; color: var(--text-medium-emphasis);">
                    <small>Show stack trace</small>
                </summary>
                <pre style="margin-top: 8px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow-x: auto; font-size: 0.75rem;">${errorContext.stack}</pre>
            </details>
        `;
    }
    
    // Show modal with loading state
    const loadingEl = modal.querySelector('.analysis-loading');
    const resultEl = modal.querySelector('.analysis-result');
    const errorEl = modal.querySelector('.analysis-error');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (resultEl) resultEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    
    modal.classList.add('show');
    
    // Analyze with AI
    const analysis = await aiAssistant.analyzeError(errorContext);
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (analysis && analysis.error) {
        // Show error message
        if (errorEl) {
            errorEl.innerHTML = `
                <div style="color: var(--color-red); padding: 16px; background: rgba(255, 180, 171, 0.1); border-radius: 8px;">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Error:</strong> ${analysis.error}
                    ${analysis.setupInstructions ? `<br><small>${analysis.setupInstructions}</small>` : ''}
                </div>
            `;
            errorEl.style.display = 'block';
        }
    } else if (analysis) {
        // Show AI analysis
        const causeText = resultEl.querySelector('.cause-text');
        const fixesList = resultEl.querySelector('.fixes-list');
        const codeSuggestion = resultEl.querySelector('.code-suggestion');
        
        if (causeText) {
            causeText.textContent = analysis.rootCause;
        }
        
        if (fixesList) {
            fixesList.innerHTML = analysis.fixSteps
                .map(step => `<li>${step}</li>`)
                .join('');
        }
        
        if (codeSuggestion && analysis.codeSnippet) {
            codeSuggestion.innerHTML = `
                <h4>Code Suggestion</h4>
                <pre style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow-x: auto;"><code>${escapeHtml(analysis.codeSnippet)}</code></pre>
            `;
        }
        
        if (resultEl) resultEl.style.display = 'block';
    }
}

/**
 * Close error assistant modal
 */
function closeErrorAssistant() {
    const modal = document.getElementById('errorAssistantModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Copy error details to clipboard
 */
function copyErrorDetails() {
    const modal = document.getElementById('errorAssistantModal');
    if (!modal) return;
    
    const errorMessage = modal.querySelector('.error-message');
    const causeText = modal.querySelector('.cause-text');
    const fixesList = modal.querySelector('.fixes-list');
    
    let text = 'ERROR DETAILS:\n';
    if (errorMessage) {
        text += errorMessage.textContent.trim() + '\n\n';
    }
    
    if (causeText) {
        text += 'ROOT CAUSE:\n' + causeText.textContent.trim() + '\n\n';
    }
    
    if (fixesList) {
        text += 'FIX STEPS:\n' + fixesList.textContent.trim() + '\n';
    }
    
    navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Error details copied to clipboard');
        // Show brief notification
        const btn = modal.querySelector('.action-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load (lazy init on first error)
console.log('🤖 AI Assistant module loaded');
