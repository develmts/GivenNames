// src/exceptions/httpException.ts
import { AppException } from "@/exceptions/appException.js"

/**
 * Base HTTP Exception — maps to an HTTP status code.
 */
export class HTTPException extends AppException {
  status: number

  constructor(status: number, message: string, details?: any) {
    super(message, details)
    this.status = status
  }
  
  show():string {
    return `${this.name}${this.status}: ${this.message}`
  }

   /**
   * Retorna la representació JSON estàndard d’aquest error,
   * en un format compatible amb la sortida d’Hono.
   */
  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        status: this.status,
        ...(this.details ? { details: this.details } : {})
      }
    }
  }
}

// --- Common subclasses ---

export class BadRequestException extends HTTPException {
  constructor(message = "Bad Request", details?: any) {
    super(400, message, details)
  }
}

export class UnauthorizedException extends HTTPException {
  constructor(message = "Unauthorized", details?: any) {
    super(401, message, details)
  }
}

export class ForbiddenException extends HTTPException {
  constructor(message = "Forbidden", details?: any) {
    super(403, message, details)
  }
}

export class NotFoundException extends HTTPException {
  constructor(message = "Not Found", details?: any) {
    super(404, message, details)
  }
}

export class ConflictException extends HTTPException {
  constructor(message = "Conflict", details?: any) {
    super(409, message, details)
  }
}

export class InternalServerErrorException extends HTTPException {
  constructor(message = "Internal Server Error", details?: any) {
    super(500, message, details)
  }
}
