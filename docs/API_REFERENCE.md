# Enhanced Daily Tips System - API Reference

## 📚 API Endpoints Reference

### Base URL
All API endpoints are relative to your application's base URL.

---

## 🎯 Core Endpoints

### 1. Daily Tips Generation

#### `POST /api/daily-tips`

Generates personalized daily tips based on comprehensive user data.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```typescript
interface DailyTipsInput {
  schedule: string;                    // Required: JSON string of time blocks
  historicalPatterns?: string;         // Optional: JSON string of historical data
  userPreferences?: string;            // Optional: JSON string of user preferences  
  contextualData?: string;             // Optional: JSON string of contextual info
  previousTipsFeedback?: string;       // Optional: JSON string of feedback history
  userGoals?: string;                  // Optional: JSON string of user goals
  apiKey: string;                      // Required: Gemini API key
}
```

**Response:**
```typescript
interface TipsResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    category: 'AUTHENTICATION' | 'RATE_LIMIT' | 'NETWORK' | 'VALIDATION' | 'AI_SERVICE' | 'TIMEOUT' | 'UNKNOWN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    retryable: boolean;
    suggestedAction: string;
    timestamp: Date;
    context?: any;
  };
  fallbackData?: DailyTips;
}
```

**Success Response Data:**
```typescript
interface DailyTips {
  tips: EnhancedTip[];
  summary: TipsSummary;
  analytics: TipsAnalytics;
}

interface EnhancedTip {
  id: string;
  type: 'Productivity' | 'Health' | 'Mindfulness' | 'Time Management' | 'Energy' | 'Focus' | 'Breaks' | 'Communication' | 'Learning' | 'Habits';
  subCategory?: string;
  title: string;
  suggestion: string;
  reasoning: string;
  expectedImpact: string;
  actionSteps: string[];
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeInvestment: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  estimatedDuration?: string;
  relatedGoals?: string[];
  tags?: string[];
  personalizedScore: number; // 0-100
}
```

**Example Request:**
```javascript
const response = await fetch('/api/daily-tips', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    schedule: JSON.stringify([
      {
        id: '1',
        title: 'Morning Workout',
        startTime: '2024-01-01T07:00:00Z',
        duration: 45,
        category: 'Health',
        completed: true,
        reflection: { mood: 'energetic', productivity: 5 }
      }
    ]),
    userPreferences: JSON.stringify({
      preferredCategories: ['Health', 'Productivity'],
      tipStyle: 'detailed',
      focusAreas: ['morning-routine']
    }),
    apiKey: 'your-gemini-api-key'
  })
});

const result = await response.json();
```

**Error Response Examples:**
```javascript
// Rate limit exceeded
{
  "error": "429 Too Many Requests - API rate limit exceeded. Please update your Gemini API key."
}

// Invalid API key
{
  "error": "Invalid API Key. Please check your key in the settings."
}

// Generic error
{
  "error": "Failed to generate daily tips"
}
```

---

### 2. Daily Insights

#### `POST /api/daily-insights`

Generates analytical insights about daily performance and patterns.

**Request Body:**
```typescript
interface DailyInsightsInput {
  dailyData: string;    // Required: JSON string of daily performance data
  apiKey: string;       // Required: Gemini API key
}
```

**Example Request:**
```javascript
const response = await fetch('/api/daily-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dailyData: JSON.stringify({
      productivity: 4.2,
      mood: 'focused',
      completedTasks: 8,
      totalTasks: 10,
      energyLevel: 'high'
    }),
    apiKey: 'your-gemini-api-key'
  })
});
```

---

### 3. Sidebar Tips

#### `POST /api/daily-sidebar-tip`

Provides contextual tips optimized for sidebar display.

**Request Body:**
```typescript
interface DailySidebarTipInput {
  currentActivity?: string;
  timeOfDay?: string;
  recentPerformance?: string;
  apiKey: string;
}
```

---

### 4. Smart Suggestions

#### `POST /api/smart-suggestions`

Offers intelligent suggestions based on current context and user state.

**Request Body:**
```typescript
interface SmartSuggestionsInput {
  currentContext: string;
  userState: string;
  recentActivity: string;
  apiKey: string;
}
```

---

### 5. Habit Stacking

#### `POST /api/habit-stacking`

Generates habit stacking recommendations for building new routines.

**Request Body:**
```typescript
interface HabitStackingInput {
  existingHabits: string;
  targetHabit: string;
  userSchedule: string;
  apiKey: string;
}
```

---

### 6. Energy Optimization

#### `POST /api/energy-optimization`

Provides energy management and optimization suggestions.

**Request Body:**
```typescript
interface EnergyOptimizationInput {
  dailyData: string;
  upcomingTasks?: string;
  currentTime?: string;
  apiKey: string;
}
```

---

## 🛡️ Error Handling

### Error Categories

| Category | Description | Retryable | Typical Causes |
|----------|-------------|-----------|----------------|
| `AUTHENTICATION` | API key issues | No | Invalid/missing API key |
| `RATE_LIMIT` | API quota exceeded | Yes | Too many requests |
| `NETWORK` | Connection problems | Yes | Internet connectivity |
| `VALIDATION` | Input errors | No | Malformed request data |
| `AI_SERVICE` | AI model issues | Yes | Temporary service unavailability |
| `TIMEOUT` | Request timeout | Yes | Slow network/server |
| `UNKNOWN` | Unexpected errors | Maybe | Unexpected system issues |

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;                    // Human-readable error message
  code?: string;                    // Machine-readable error code
  details?: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
    suggestedAction: string;
    timestamp: string;
  };
}
```

### Handling Errors

```javascript
try {
  const response = await fetch('/api/daily-tips', options);
  
  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle specific error types
    if (response.status === 429) {
      console.log('Rate limited:', errorData.error);
      // Show rate limit message to user
    } else if (response.status === 400) {
      console.log('Bad request:', errorData.error);
      // Show validation error to user
    } else {
      console.log('Server error:', errorData.error);
      // Show generic error message
    }
    
    return;
  }
  
  const result = await response.json();
  
  // Handle successful response
  if (result.success) {
    // Use result.data
  } else {
    // Use result.fallbackData if available
  }
  
} catch (error) {
  console.error('Network error:', error);
  // Handle network errors
}
```

---

## 📊 Response Data Structures

### EnhancedTip

```typescript
interface EnhancedTip {
  id: string;                           // Unique identifier
  type: TipCategory;                    // Main category
  subCategory?: string;                 // Specific subcategory
  title: string;                        // Brief title
  suggestion: string;                   // Main recommendation
  reasoning: string;                    // Why this tip is relevant
  expectedImpact: string;               // Expected results
  actionSteps: string[];                // Step-by-step instructions
  priority: 'low' | 'medium' | 'high'; // Urgency level
  difficulty: 'easy' | 'moderate' | 'challenging'; // Implementation difficulty
  timeInvestment: TimeInvestment;       // Time horizon
  estimatedDuration?: string;           // Time to complete
  relatedGoals?: string[];              // Connected user goals
  tags?: string[];                      // Searchable tags
  personalizedScore: number;            // Relevance score (0-100)
}
```

### TipsSummary

```typescript
interface TipsSummary {
  overallTheme: string;                 // Main focus theme
  keyInsights: string[];                // Important observations
  priorityFocus: string;                // Most important area
  encouragement: string;                // Motivational message
  estimatedTimeInvestment: string;      // Total time needed
  difficultyDistribution: {             // Breakdown by difficulty
    easy: number;
    moderate: number;
    challenging: number;
  };
}
```

### TipsAnalytics

```typescript
interface TipsAnalytics {
  dataQualityScore: number;             // Input data quality (0-100)
  personalizationLevel: 'low' | 'medium' | 'high'; // Personalization strength
  confidenceScore: number;              // AI confidence (0-100)
  diversityScore: number;               // Tip variety (0-100)
  relevanceFactors: string[];           // Key relevance drivers
  improvementAreas: string[];           // Suggested focus areas
  generationMetadata: {
    model: string;
    processingTime: number;
    tokensUsed: number;
    cacheHit: boolean;
  };
}
```

---

## 🔧 Integration Examples

### React Hook Integration

```typescript
// Custom hook for daily tips
function useDailyTips() {
  const [tips, setTips] = useState<DailyTips | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateTips = async (input: DailyTipsInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTips(result.data);
      } else {
        setTips(result.fallbackData);
        setError('Using fallback tips due to service unavailability');
      }
      
    } catch (err) {
      setError(err.message);
      setTips(null);
    } finally {
      setLoading(false);
    }
  };
  
  return { tips, loading, error, generateTips };
}
```

### TypeScript Validation

```typescript
import { z } from 'zod';

// Request validation schema
const DailyTipsInputSchema = z.object({
  schedule: z.string(),
  historicalPatterns: z.string().optional(),
  userPreferences: z.string().optional(),
  contextualData: z.string().optional(),
  previousTipsFeedback: z.string().optional(),
  userGoals: z.string().optional(),
  apiKey: z.string().min(1)
});

// Validate input before sending
const validateInput = (input: any): DailyTipsInput => {
  return DailyTipsInputSchema.parse(input);
};
```

### Caching Implementation

```typescript
class TipsCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttl: number = 3600000) { // 1 hour default
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  generateKey(input: DailyTipsInput): string {
    // Generate cache key based on input parameters
    const keyData = {
      schedule: input.schedule,
      preferences: input.userPreferences,
      date: new Date().toDateString()
    };
    return btoa(JSON.stringify(keyData));
  }
}

// Usage with caching
const cache = new TipsCache();

const getTipsWithCache = async (input: DailyTipsInput) => {
  const cacheKey = cache.generateKey(input);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch('/api/daily-tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  const result = await response.json();
  
  if (result.success) {
    cache.set(cacheKey, result.data);
  }
  
  return result;
};
```

---

## 🚀 Performance Optimization

### Request Batching

```typescript
// Batch multiple AI requests
const batchAIRequests = async (apiKey: string, requests: any[]) => {
  const endpoints = [
    '/api/daily-tips',
    '/api/daily-insights', 
    '/api/smart-suggestions'
  ];
  
  const promises = requests.map((request, index) => 
    fetch(endpoints[index], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, apiKey })
    })
  );
  
  const responses = await Promise.allSettled(promises);
  
  return responses.map(async (response, index) => {
    if (response.status === 'fulfilled' && response.value.ok) {
      return await response.value.json();
    }
    return null;
  });
};
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;
  
  constructor(limit: number = 60, window: number = 60000) { // 60 requests per minute
    this.limit = limit;
    this.window = window;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.window);
    
    if (this.requests.length >= this.limit) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldest = Math.min(...this.requests);
    return Math.max(0, this.window - (Date.now() - oldest));
  }
}

// Usage
const rateLimiter = new RateLimiter();

const makeRateLimitedRequest = async (url: string, options: any) => {
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getTimeUntilReset();
    throw new Error(`Rate limited. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
  }
  
  return fetch(url, options);
};
```

---

## 🔍 Debugging and Monitoring

### Debug Mode

```javascript
// Enable detailed logging
localStorage.setItem('tips_debug_mode', 'true');

// This will log:
// - Request/response details
// - Performance metrics  
// - Error details
// - Cache hits/misses
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  private metrics: Array<{ operation: string; duration: number; timestamp: number }> = [];
  
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.metrics.push({
        operation,
        duration,
        timestamp: Date.now()
      });
      
      if (localStorage.getItem('tips_debug_mode')) {
        console.log(`${operation} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${operation} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
  
  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    
    return operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
  }
}

// Usage
const monitor = new PerformanceMonitor();

const monitoredRequest = (url: string, options: any) => {
  return monitor.measure('api-request', () => fetch(url, options));
};
```

---

This API reference provides comprehensive documentation for integrating with the Enhanced Daily Tips System. For additional examples and advanced usage patterns, refer to the test files and main documentation.