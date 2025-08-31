# Daily Tips System - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 🔧 Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] API key is set in `.env.local`
- [ ] Build completes without errors (`npm run build`)
- [ ] No browser console errors
- [ ] Network connectivity is working
- [ ] API quota is not exceeded

---

## ❌ Build and Compilation Errors

### Issue: "Parsing ecmascript source code failed"

**Error Message:**
```
Parsing ecmascript source code failed
./src/components/tip-feedback-modal.tsx (128:6)
Unexpected token `div`. Expected jsx identifier
```

**Cause:** Escaped quotes in JSX syntax

**Solution:**
```typescript
// ❌ Wrong - escaped quotes
<div className=\"space-y-2\">

// ✅ Correct - normal quotes  
<div className="space-y-2">
```

**Fix Steps:**
1. Search for `\"` in your JSX files
2. Replace with `"`
3. Run `npm run build` to verify

---

### Issue: "Expected ',', got ';' in TypeScript"

**Error Message:**
```
Expected ',', got ';'
const categoryPerformance = new Map<string, { completed: number; total: number; avgProductivity: number }>();
```

**Cause:** Semicolons instead of commas in TypeScript interface

**Solution:**
```typescript
// ❌ Wrong - semicolons in interface
new Map<string, { completed: number; total: number; avgProductivity: number }>()

// ✅ Correct - commas in interface
new Map<string, { completed: number, total: number, avgProductivity: number }>()
```

---

### Issue: "Expected a semicolon / Expression expected"

**Cause:** Orphaned code blocks or incomplete functions

**Solution:**
1. Check for incomplete function definitions
2. Look for stray code outside function bodies
3. Verify all brackets and braces are properly closed

---

## 🔑 API and Authentication Errors

### Issue: "Invalid API Key"

**Error Message:**
```
Invalid API Key. Please check your key in the settings.
```

**Causes & Solutions:**

1. **Missing API Key**
   ```env
   # Add to .env.local
   GEMINI_API_KEY=your_actual_api_key_here
   ```

2. **Wrong Key Format**
   - Gemini API keys should start with specific prefixes
   - Verify key from Google Cloud Console

3. **Key Not Loading**
   ```typescript
   // Check if key is accessible
   console.log('API Key loaded:', !!process.env.GEMINI_API_KEY);
   ```

4. **Restart Development Server**
   ```bash
   # Stop server and restart
   npm run dev
   ```

---

### Issue: "429 Too Many Requests - API rate limit exceeded"

**Error Message:**
```
429 Too Many Requests - API rate limit exceeded. Please update your Gemini API key.
```

**Solutions:**

1. **Check API Quota**
   - Visit Google Cloud Console
   - Check API usage and limits
   - Upgrade plan if needed

2. **Implement Request Throttling**
   ```typescript
   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
   
   const makeThrottledRequest = async (url: string, options: any) => {
     try {
       return await fetch(url, options);
     } catch (error) {
       if (error.message.includes('429')) {
         await delay(2000); // Wait 2 seconds
         return fetch(url, options); // Retry
       }
       throw error;
     }
   };
   ```

3. **Use Caching**
   ```typescript
   // Enable caching to reduce API calls
   localStorage.setItem('tips_cache_enabled', 'true');
   ```

---

## 🚫 Server Components and Runtime Errors

### Issue: "An error occurred in the Server Components render"

**Error Message:**
```
Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.
```

**Cause:** Server actions called from client components

**Solution:**
```typescript
// ❌ Wrong - direct server function import in client component
'use client';
import { getDailyTips } from '@/ai/flows/daily-tips';

// ✅ Correct - use API routes
'use client';
const response = await fetch('/api/daily-tips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Migration Steps:**
1. Replace all direct AI function imports with API calls
2. Update context to use fetch instead of direct calls
3. Verify no `'use server'` functions are imported in `'use client'` components

---

### Issue: "Function components cannot be given refs"

**Cause:** Trying to pass refs to functional components without forwardRef

**Solution:**
```typescript
// ❌ Wrong
const TipCard = ({ tip }) => <div>{tip.title}</div>;

// ✅ Correct - with forwardRef if needed
const TipCard = forwardRef<HTMLDivElement, { tip: Tip }>(({ tip }, ref) => (
  <div ref={ref}>{tip.title}</div>
));
```

---

## 🌐 Network and API Issues

### Issue: API Requests Failing Silently

**Symptoms:** No tips generated, no error messages

**Debug Steps:**
1. **Enable Debug Mode**
   ```javascript
   localStorage.setItem('tips_debug_mode', 'true');
   ```

2. **Check Network Tab**
   - Open browser DevTools
   - Check Network tab for failed requests
   - Look for 400/500 status codes

3. **Verify Request Format**
   ```javascript
   // Log request before sending
   console.log('Sending request:', JSON.stringify(requestData, null, 2));
   ```

---

### Issue: "Failed to fetch" or Network Errors

**Causes & Solutions:**

1. **CORS Issues (Development)**
   ```javascript
   // Check if running on correct port
   console.log('Current URL:', window.location.href);
   // Should be http://localhost:3000 or your dev server
   ```

2. **API Route Not Found**
   ```bash
   # Verify API route files exist
   ls src/app/api/daily-tips/route.ts
   ls src/app/api/daily-insights/route.ts
   ```

3. **Server Not Running**
   ```bash
   # Restart development server
   npm run dev
   ```

---

## 📊 Data and Personalization Issues

### Issue: Tips Not Personalized

**Symptoms:** Generic tips, low personalization scores

**Solutions:**

1. **Provide More User Data**
   ```typescript
   const input = {
     schedule: JSON.stringify(timeBlocks),
     historicalPatterns: JSON.stringify(patterns), // Add this
     userPreferences: JSON.stringify(preferences), // Add this
     contextualData: JSON.stringify(context),      // Add this
     apiKey: apiKey
   };
   ```

2. **Enable Feedback Learning**
   ```typescript
   // Track user interactions
   const { trackTipInteraction } = useTimeBubbles();
   
   const handleTipView = () => {
     trackTipInteraction(tip.id, 'viewed');
   };
   ```

3. **Check Personalization Engine**
   ```javascript
   // Debug personalization
   const engine = TipPersonalizationEngine.getInstance();
   console.log('User preferences:', engine.getUserPreferences());
   console.log('Personalization weights:', engine.getPersonalizationWeights());
   ```

---

### Issue: No Fallback Tips Showing

**Symptoms:** Blank screen when API fails

**Solution:**
```typescript
// Ensure fallback handling
const { dailyTips } = useTimeBubbles();

if (dailyTips?.fallbackData) {
  return <FallbackTipsDisplay tips={dailyTips.fallbackData.tips} />;
}

if (!dailyTips?.tips?.length) {
  return <EmptyState message="No tips available" />;
}
```

---

## 🎨 UI and UX Issues

### Issue: Loading States Not Working

**Symptoms:** No loading indicators, immediate results

**Solution:**
```typescript
const { isLoadingTips } = useTimeBubbles();

return (
  <div>
    {isLoadingTips ? (
      <LoadingSpinner />
    ) : (
      <TipsDisplay tips={dailyTips?.tips} />
    )}
  </div>
);
```

---

### Issue: Tip Feedback Modal Not Opening

**Debug Steps:**
1. **Check State Management**
   ```typescript
   const [isModalOpen, setIsModalOpen] = useState(false);
   
   // Debug modal state
   console.log('Modal open:', isModalOpen);
   ```

2. **Verify Modal Props**
   ```typescript
   <TipFeedbackModal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     tip={selectedTip}
     onSubmit={handleFeedbackSubmit}
   />
   ```

---

## 🔍 Debugging Tools and Techniques

### Enable Comprehensive Logging

```javascript
// Enable all debug features
localStorage.setItem('tips_debug_mode', 'true');
localStorage.setItem('tips_verbose_logging', 'true');
localStorage.setItem('tips_performance_monitoring', 'true');
```

### Check Component State

```typescript
// Add to any component
useEffect(() => {
  console.log('Component state:', {
    dailyTips,
    isLoadingTips,
    error
  });
}, [dailyTips, isLoadingTips, error]);
```

### Monitor API Performance

```typescript
const monitorApiCall = async (url: string, options: any) => {
  const start = performance.now();
  
  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    
    console.log(`API call to ${url} took ${duration.toFixed(2)}ms`);
    console.log('Response status:', response.status);
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

### Check Local Storage

```javascript
// View cached data
console.log('Tips cache:', localStorage.getItem('daily_tips_cache'));
console.log('User preferences:', localStorage.getItem('user_tip_preferences'));
console.log('Tracking data:', localStorage.getItem('tip_tracking_data'));
```

---

## 🧪 Testing and Validation

### Test API Endpoints Manually

```javascript
// Test in browser console
const testApiEndpoint = async () => {
  try {
    const response = await fetch('/api/daily-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule: JSON.stringify([{
          id: '1',
          title: 'Test Task',
          startTime: new Date().toISOString(),
          duration: 30,
          category: 'Work',
          completed: true
        }]),
        apiKey: 'your-api-key'
      })
    });
    
    const result = await response.json();
    console.log('API Test Result:', result);
  } catch (error) {
    console.error('API Test Failed:', error);
  }
};

testApiEndpoint();
```

### Validate Data Formats

```typescript
// Check input data format
const validateScheduleData = (schedule: string) => {
  try {
    const parsed = JSON.parse(schedule);
    console.log('Schedule data valid:', Array.isArray(parsed));
    return Array.isArray(parsed);
  } catch (error) {
    console.error('Invalid schedule data:', error);
    return false;
  }
};
```

---

## 🚨 Emergency Fixes

### Quick Reset to Working State

```javascript
// Clear all cached data
localStorage.clear();

// Reset to defaults
localStorage.setItem('tips_system_reset', Date.now().toString());

// Refresh page
window.location.reload();
```

### Rollback to Fallback Mode

```typescript
// Force fallback mode
const enableFallbackMode = () => {
  localStorage.setItem('tips_force_fallback', 'true');
  // System will use static tips instead of AI
};
```

### Check System Health

```javascript
const healthCheck = async () => {
  const checks = {
    apiKey: !!process.env.GEMINI_API_KEY,
    localStorage: typeof(Storage) !== "undefined",
    fetch: typeof fetch !== "undefined",
    context: !!useTimeBubbles
  };
  
  console.log('System Health Check:', checks);
  return Object.values(checks).every(Boolean);
};
```

---

## 📞 Getting Additional Help

### Information to Collect When Reporting Issues

1. **Error Details**
   - Exact error message
   - Browser console output
   - Network tab in DevTools

2. **Environment Info**
   - Browser and version
   - Node.js version
   - Next.js version

3. **Reproduction Steps**
   - What you were trying to do
   - Steps to reproduce
   - Expected vs actual behavior

4. **System State**
   ```javascript
   // Run this and include output
   console.log({
     userAgent: navigator.userAgent,
     url: window.location.href,
     localStorage: Object.keys(localStorage),
     apiKeyExists: !!process.env.GEMINI_API_KEY
   });
   ```

### Enable Maximum Debugging

```javascript
// Enable all debugging features
localStorage.setItem('tips_debug_mode', 'true');
localStorage.setItem('tips_verbose_logging', 'true');
localStorage.setItem('tips_error_tracking', 'true');
localStorage.setItem('tips_performance_monitoring', 'true');

// Then reproduce the issue and share console output
```

---

**Remember:** Most issues are resolved by checking API keys, clearing cache, and ensuring proper data formats. When in doubt, enable debug mode first! 🔍