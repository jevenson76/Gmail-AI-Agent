/**
 * Custom error classes and error handling utilities
 */

/**
 * Base API error class
 */
export class APIError extends Error {
  constructor(
    message: string, 
    public readonly code?: string, 
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Authentication error class
 */
export class AuthError extends APIError {
  constructor(message: string, originalError?: any) {
    super(message, 'AUTH_ERROR', originalError);
    this.name = 'AuthError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends APIError {
  constructor(message: string, originalError?: any) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Service unavailable error class
 */
export class ServiceError extends APIError {
  constructor(message: string, originalError?: any) {
    super(message, 'SERVICE_ERROR', originalError);
    this.name = 'ServiceError';
  }
}

/**
 * Data validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string, 
    public readonly field?: string, 
    public readonly value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Helper function to format error messages with user-friendly text
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  } else if (error instanceof ValidationError) {
    return `Validation error: ${error.message}${error.field ? ` (${error.field})` : ''}`;
  } else if (error instanceof Error) {
    return `Error: ${error.message}`;
  } else {
    return 'An unknown error occurred. Please try again.';
  }
}

/**
 * Helper function to determine if an error is related to authentication
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return true;
  }
  
  if (error instanceof APIError) {
    return error.code === 'AUTH_ERROR' || 
           error.message.toLowerCase().includes('auth') ||
           error.message.toLowerCase().includes('token');
  }
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('auth') || 
           errorMessage.includes('token') || 
           errorMessage.includes('login') || 
           errorMessage.includes('permission');
  }
  
  return false;
}

/**
 * Helper function to determine if an error is related to network issues
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof APIError) {
    return error.code === 'NETWORK_ERROR';
  }
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('network') || 
           errorMessage.includes('internet') || 
           errorMessage.includes('offline') || 
           errorMessage.includes('connection');
  }
  
  return false;
}

/**
 * Helper function to log errors to the console or a monitoring service
 */
export function logError(error: unknown, context?: any): void {
  if (error instanceof Error) {
    console.error(`[${error.name}]`, error.message, context || '', error.stack);
    
    // Here you could add integration with error monitoring services
    // Example: if (typeof window.ErrorReportingService !== 'undefined') {
    //   window.ErrorReportingService.captureException(error, { extra: context });
    // }
  } else {
    console.error('Unknown error:', error, context);
  }
}

/**
 * Wraps async functions to handle errors consistently
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T> {
  return fn().catch((error) => {
    logError(error);
    if (errorHandler) {
      errorHandler(error);
    }
    throw error;
  });
}