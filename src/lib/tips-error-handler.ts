/**
 * @fileOverview Comprehensive Error Handling and Logging for Daily Tips System
 * 
 * This module provides robust error handling, logging, and recovery mechanisms
 * for the enhanced daily tips generation system.
 */

import { TipError, TipGenerationContext } from '@/types/ai-types';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better classification
export enum ErrorCategory {
  API = 'api',
  NETWORK = 'network',
  VALIDATION = 'validation',
  GENERATION = 'generation',
  DATA_PROCESSING = 'data_processing',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: Date;
    context?: any;
    retryable: boolean;
    suggestedAction?: string;
  };
  fallbackData?: any;
}

// Success response interface
export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    generationTime: number;
    cacheHit: boolean;
    dataQuality: number;
  };
}

export type TipsResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Enhanced error handler class for daily tips system
 */
export class TipsErrorHandler {
  private static instance: TipsErrorHandler;
  private errorLog: TipError[] = [];
  private retryQueue: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): TipsErrorHandler {
    if (!TipsErrorHandler.instance) {
      TipsErrorHandler.instance = new TipsErrorHandler();
    }
    return TipsErrorHandler.instance;
  }

  /**
   * Handles errors with appropriate classification and response
   */
  handleError(
    error: any, 
    context: TipGenerationContext,
    retryAttempt: number = 0
  ): ErrorResponse {
    const classified = this.classifyError(error);
    const errorRecord = this.createErrorRecord(error, classified, context, retryAttempt);
    
    // Log the error
    this.logError(errorRecord);
    
    // Determine if retry is appropriate
    const shouldRetry = this.shouldRetry(classified, retryAttempt);
    
    // Update retry queue
    if (shouldRetry) {
      this.updateRetryQueue(context.sessionId, retryAttempt + 1);
    }

    return {
      success: false,
      error: {
        code: this.generateErrorCode(classified),
        message: this.getUserFriendlyMessage(classified, error),
        category: classified.category,
        severity: classified.severity,
        timestamp: new Date(),
        context: this.sanitizeContext(context),
        retryable: shouldRetry,
        suggestedAction: this.getSuggestedAction(classified)
      },
      fallbackData: this.getFallbackData(classified)
    };
  }

  /**
   * Classifies errors into categories and severity levels
   */
  private classifyError(error: any): { category: ErrorCategory; severity: ErrorSeverity } {
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.status || error.code;

    // API-related errors
    if (errorMessage.includes('api key') || statusCode === 401) {
      return { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH };
    }

    if (statusCode === 400) {
      return { category: ErrorCategory.API, severity: ErrorSeverity.MEDIUM };
    }

    if (statusCode === 429 || errorMessage.includes('rate limit')) {
      return { category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.HIGH };
    }

    if (statusCode === 403) {
      return { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH };
    }

    if (statusCode >= 500) {
      return { category: ErrorCategory.API, severity: ErrorSeverity.CRITICAL };
    }

    // Network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || 
        errorMessage.includes('connection') || statusCode === 0) {
      return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('schema') || 
        errorMessage.includes('invalid input')) {
      return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW };
    }

    // Generation-specific errors
    if (errorMessage.includes('generation') || errorMessage.includes('prompt') || 
        errorMessage.includes('quality')) {
      return { category: ErrorCategory.GENERATION, severity: ErrorSeverity.MEDIUM };
    }

    // Data processing errors
    if (errorMessage.includes('parse') || errorMessage.includes('processing') || 
        errorMessage.includes('data')) {
      return { category: ErrorCategory.DATA_PROCESSING, severity: ErrorSeverity.LOW };
    }

    // Default to unknown
    return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }

  /**
   * Creates a comprehensive error record
   */
  private createErrorRecord(
    error: any,
    classified: { category: ErrorCategory; severity: ErrorSeverity },
    context: TipGenerationContext,
    retryAttempt: number
  ): TipError {
    return {
      errorType: classified.category as any,
      errorMessage: error.message || 'Unknown error occurred',
      errorContext: JSON.stringify({
        stack: error.stack,
        statusCode: error.status || error.code,
        context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString()
      }),
      retryAttempts: retryAttempt,
      timestamp: new Date(),
      resolved: false
    };
  }

  /**
   * Logs error to internal log and external services if configured
   */
  private logError(errorRecord: TipError): void {
    // Add to internal log
    this.errorLog.push(errorRecord);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console logging for development
    console.error('Tips System Error:', {
      type: errorRecord.errorType,
      message: errorRecord.errorMessage,
      retryAttempts: errorRecord.retryAttempts,
      timestamp: errorRecord.timestamp
    });

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(errorRecord);
    }
  }

  /**
   * Determines if an error type should be retried
   */
  private shouldRetry(
    classified: { category: ErrorCategory; severity: ErrorSeverity },
    retryAttempt: number
  ): boolean {
    const maxRetries = 3;
    
    if (retryAttempt >= maxRetries) return false;

    // Don't retry authentication or validation errors
    if (classified.category === ErrorCategory.AUTHENTICATION || 
        classified.category === ErrorCategory.VALIDATION) {
      return false;
    }

    // Retry network, API (except auth), and generation errors
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.API,
      ErrorCategory.GENERATION,
      ErrorCategory.DATA_PROCESSING,
      ErrorCategory.UNKNOWN
    ].includes(classified.category);
  }

  /**
   * Updates retry queue for session tracking
   */
  private updateRetryQueue(sessionId: string, retryCount: number): void {
    this.retryQueue.set(sessionId, retryCount);
    
    // Clean up old entries
    if (this.retryQueue.size > 50) {
      const firstKey = this.retryQueue.keys().next().value;
      this.retryQueue.delete(firstKey);
    }
  }

  /**
   * Generates error codes for easier tracking
   */
  private generateErrorCode(classified: { category: ErrorCategory; severity: ErrorSeverity }): string {
    const timestamp = Date.now().toString(36);
    const categoryCode = classified.category.toUpperCase().substring(0, 3);
    const severityCode = classified.severity.toUpperCase().charAt(0);
    
    return `TIPS_${categoryCode}_${severityCode}_${timestamp}`;
  }

  /**
   * Provides user-friendly error messages
   */
  private getUserFriendlyMessage(
    classified: { category: ErrorCategory; severity: ErrorSeverity },
    originalError: any
  ): string {
    switch (classified.category) {
      case ErrorCategory.AUTHENTICATION:
        return 'There\'s an issue with your API key. Please check your Gemini API key in settings.';
      
      case ErrorCategory.RATE_LIMIT:
        return 'You\'ve reached your API usage limit. Please try again later or upgrade your plan.';
      
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorCategory.API:
        if (originalError.status >= 500) {
          return 'The AI service is temporarily unavailable. Please try again in a few minutes.';
        }
        return 'There was an issue with the AI service. Please try again.';
      
      case ErrorCategory.VALIDATION:
        return 'There\'s an issue with your data. Please try refreshing and generating tips again.';
      
      case ErrorCategory.GENERATION:
        return 'We couldn\'t generate quality tips with your current data. We\'ve provided some general recommendations instead.';
      
      case ErrorCategory.DATA_PROCESSING:
        return 'There was an issue processing your schedule data. Please try again.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
    }
  }

  /**
   * Provides suggested actions for different error types
   */
  private getSuggestedAction(classified: { category: ErrorCategory; severity: ErrorSeverity }): string {
    switch (classified.category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Update your Gemini API key in the settings page.';
      
      case ErrorCategory.RATE_LIMIT:
        return 'Wait a few minutes before trying again, or upgrade your API plan.';
      
      case ErrorCategory.NETWORK:
        return 'Check your internet connection and try again.';
      
      case ErrorCategory.API:
        return 'Try again in a few minutes. If the issue persists, check the AI service status.';
      
      case ErrorCategory.VALIDATION:
        return 'Complete more tasks with reflections to improve tip quality.';
      
      case ErrorCategory.GENERATION:
        return 'Try adding more reflection data to your completed tasks.';
      
      default:
        return 'Try again or contact support if the issue continues.';
    }
  }

  /**
   * Provides fallback data for certain error types
   */
  private getFallbackData(classified: { category: ErrorCategory; severity: ErrorSeverity }): any {
    if (classified.category === ErrorCategory.GENERATION || 
        classified.category === ErrorCategory.DATA_PROCESSING) {
      return {
        tips: [],
        useFallback: true,
        fallbackReason: classified.category
      };
    }
    return null;
  }

  /**
   * Sanitizes context data for logging (removes sensitive information)
   */
  private sanitizeContext(context: TipGenerationContext): any {
    return {
      userId: context.userId ? '***' : undefined,
      sessionId: context.sessionId,
      generationReason: context.generationReason,
      userTimezone: context.userTimezone,
      deviceContext: context.deviceContext
      // Exclude potentially sensitive environmental factors
    };
  }

  /**
   * Sends error to external logging service (placeholder)
   */
  private sendToExternalLogger(errorRecord: TipError): void {
    // Placeholder for external logging integration
    // Could integrate with services like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom analytics service
    
    try {
      // Example: Send to external service
      // await externalLogger.log(errorRecord);
    } catch (loggingError) {
      console.error('Failed to send error to external logger:', loggingError);
    }
  }

  /**
   * Gets error statistics for analytics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: TipError[];
  } {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recentErrors: this.errorLog.slice(-10)
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      const category = error.errorType as ErrorCategory;
      if (category in stats.errorsByCategory) {
        stats.errorsByCategory[category]++;
      }
    });

    return stats;
  }

  /**
   * Clears error log (for testing or maintenance)
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.retryQueue.clear();
  }

  /**
   * Gets retry count for a session
   */
  getRetryCount(sessionId: string): number {
    return this.retryQueue.get(sessionId) || 0;
  }
}

/**
 * Utility function to create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: {
    generationTime?: number;
    cacheHit?: boolean;
    dataQuality?: number;
  }
): SuccessResponse<T> {
  return {
    success: true,
    data,
    metadata
  };
}

/**
 * Utility function to wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: TipGenerationContext,
  retryAttempt: number = 0
): Promise<TipsResponse<T>> {
  const errorHandler = TipsErrorHandler.getInstance();
  
  try {
    const startTime = Date.now();
    const result = await operation();
    const generationTime = Date.now() - startTime;
    
    return createSuccessResponse(result, { generationTime });
  } catch (error) {
    return errorHandler.handleError(error, context, retryAttempt);
  }
}

// Export singleton instance
export const tipsErrorHandler = TipsErrorHandler.getInstance();