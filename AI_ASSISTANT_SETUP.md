# 🤖 AI Error Assistant - Setup Guide

## Quick Start (3 minutes)

### Step 1: Get Your Gemini API Key

1. Go to **Google AI Studio**: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key (starts with `AIza...`)

### Step 2: Add API Key to Your Project

1. Open `public/js/firebase-config.js`
2. Add your API key to the config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDYQtk-fqQUyRgH7rzE_1BhjEi2awYXYgg",
    authDomain: "smv-dashboard.firebaseapp.com",
    projectId: "smv-dashboard",
    storageBucket: "smv-dashboard.firebasestorage.app",
    messagingSenderId: "440198838976",
    appId: "1:440198838976:web:a0576dc7baf3b8ada3cb25",
    
    // ADD THIS LINE WITH YOUR KEY
    geminiApiKey: "YOUR_GEMINI_API_KEY_HERE"
};
```

### Step 3: Test It!

1. Open your dashboard in a browser
2. Click the **Edit button** (✏️) at the bottom right
3. Click the **robot button** (🤖) that appears in edit mode
4. You should see an error modal with AI analysis!

## How It Works

### Automatic Error Detection

When any JavaScript error occurs in your dashboard:

1. **Error Monitor** captures the error automatically
2. Collects context:
   - Error message and stack trace
   - Current application state (orders count, edit mode, etc.)
   - Recent user actions
   - Browser environment info
3. Sends to **Google Gemini AI** for analysis
4. Shows a beautiful modal with:
   - 🎯 **Root Cause** - What caused the error
   - 🔧 **Fix Steps** - How to fix it (step-by-step)
   - 💻 **Code Snippet** - Corrected code (if applicable)
   - 🛡️ **Prevention** - How to avoid similar errors

### Example Error Analysis

```
ROOT CAUSE:
Attempting to call a method on a null object. The variable 
'undefinedObject' is null when 'someMethod()' is called.

FIX STEPS:
1. Add null check before calling methods
2. Initialize the object before use
3. Add error boundary in the calling function

CODE SNIPPET:
if (undefinedObject && typeof undefinedObject.someMethod === 'function') {
    undefinedObject.someMethod();
}

PREVENTION:
Always validate object references before accessing properties
or methods. Use optional chaining (?.) in modern JavaScript.
```

## Configuration Options

Edit `public/js/config.js` to customize:

```javascript
const AI_CONFIG = {
    enabled: true,              // Set to false to disable AI analysis
    model: 'gemini-1.5-flash',  // AI model (fast and free)
    maxRetries: 2,              // Retry attempts if API fails
    timeout: 15000              // 15 seconds timeout
};
```

## Security & Privacy

### What Gets Sent to Gemini:
- ✅ Error message and sanitized stack trace
- ✅ Application state (orders count, edit mode, etc.)
- ✅ Recent user actions (clicks, edits)
- ✅ Browser environment info

### What DOES NOT Get Sent:
- ❌ Order data (PO numbers, parts, quantities)
- ❌ Customer information
- ❌ Firebase credentials
- ❌ Full file paths (sanitized to relative paths)

### Restricting Your API Key (Recommended)

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Find your API key and click **Edit**
4. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your production domain (e.g., `https://your-dashboard.web.app/*`)
5. Click **Save**

This prevents unauthorized use of your API key.

## Free Tier Limits

Google Gemini offers generous free limits:

| Metric | Free Tier | Sufficient For |
|--------|-----------|----------------|
| Requests per minute | 15 | ✅ Multiple errors/min |
| Requests per day | 1,500 | ✅ Production usage |
| Rate limit | Yes | ✅ Automatic throttling |

**Cost**: $0 (completely free within limits)

## Troubleshooting

### "AI Assistant not properly configured"

**Problem**: API key not found

**Solution**:
1. Check `firebase-config.js` has `geminiApiKey` property
2. Verify key is correct (no extra spaces)
3. Reload the page

### "Invalid API key"

**Problem**: API key is wrong or restricted

**Solution**:
1. Go back to https://aistudio.google.com/apikey
2. Verify your key or create a new one
3. Update `firebase-config.js`
4. Clear browser cache and reload

### "API quota exceeded"

**Problem**: Hit the free tier limit (rare)

**Solution**:
1. Wait until next day (resets at midnight PT)
2. Or upgrade to paid tier (if needed)
3. Consider disabling AI temporarily: `AI_CONFIG.enabled = false`

### Error modal shows but no AI analysis

**Problem**: Network issue or timeout

**Solution**:
1. Check internet connection
2. Open browser console (F12) for detailed errors
3. Try the test button again
4. Increase timeout in `AI_CONFIG.timeout`

## Testing

### Manual Test

1. Enable **Edit Mode** (✏️ button)
2. Click the **🤖 Test AI** button
3. Modal should appear with AI analysis

### What to Verify:

- ✅ Modal appears automatically
- ✅ Shows "Analyzing error with AI..." (loading state)
- ✅ Displays root cause, fix steps, code suggestion
- ✅ "Copy Details" button works
- ✅ Modal dismisses when clicked outside or "Dismiss" button

## Advanced Usage

### Disable for Specific Errors

Edit `error-monitor.js` to filter errors:

```javascript
// Skip errors from specific files
if (errorContext.filename.includes('third-party.js')) {
    return; // Don't analyze
}
```

### Custom Error Handling

You can manually trigger AI analysis:

```javascript
try {
    // Your code
} catch (error) {
    handleRuntimeError({
        message: error.message,
        error: error,
        filename: 'my-module.js',
        lineno: 42,
        colno: 10
    });
}
```

## Support

If you encounter issues:

1. Check browser console (F12) for detailed logs
2. Look for messages starting with `🤖` or `❌`
3. Verify all setup steps were completed
4. Test with the 🤖 button in edit mode

---

**Note**: The AI Assistant enhances debugging but doesn't replace good error handling practices. Always implement proper try-catch blocks and validation in your code!

## Files Created/Modified

**New Files:**
- `public/js/error-monitor.js` - Error capture and context building
- `public/js/ai-assistant.js` - Gemini AI integration

**Modified Files:**
- `public/index.html` - Added AI modal and scripts
- `public/css/components.css` - AI modal styling
- `public/js/config.js` - AI configuration
- `public/js/firebase-config.js` - API key placeholder
- `public/js/main.js` - Enhanced error handlers
- `public/js/edit-mode.js` - Test button
- `README.md` - Documentation

## Next Steps

1. ✅ Add your Gemini API key
2. ✅ Test with the 🤖 button
3. ✅ (Optional) Restrict your API key in Google Cloud
4. ✅ Deploy to production

Enjoy intelligent error debugging! 🎉
