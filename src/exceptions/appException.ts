// src/exception.ts

/**
 * Base exception for the application.
 * Independent of HTTP or specific frameworks.
 */
export class AppException extends Error {
  details?: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = new.target.name
    this.details = details
    
    // automatically generates kinda "this.stack"
    Error.captureStackTrace?.(this, this.constructor)
  }

  show(){
    return `Exception ${this.name}: ${this.message}`
  }
}

/**
 * Exception for configuration or environment errors.
 */
export class ConfigException extends AppException {
  constructor(message = "Configuration error", details?: any) {
    super(message, details)
  }
}

/**
 * Exception for persistence / database problems.
 */
export class DatabaseException extends AppException {
  constructor(message = "Database error", details?: any) {
    super(message, details)
  }
}

/**
 * Exception for authentication / identity errors (not HTTP).
 */
export class AuthException extends AppException {
  constructor(message = "Authentication error", details?: any) {
    super(message, details)
  }
}

/**
 * Exception for validation or invariant violations.
 */
export class ValidationException extends AppException {
  constructor(message = "Validation failed", details?: any) {
    super(message, details)
  }
}

