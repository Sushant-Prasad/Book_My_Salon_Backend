class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode
        this.message = message

        Error.captureStackTrace(this, this.constructor)
    }
}

/**
 * Transaction-specific error for transient failures
 * These errors can be safely retried
 */
export class TransactionError extends ErrorHandler {
    constructor(message, statusCode = 500, retryable = true) {
        super(message, statusCode);
        this.name = 'TransactionError';
        this.retryable = retryable;
    }
}

/**
 * Error for slot already booked (conflict)
 * This is a business logic error, not a technical error
 */
export class SlotConflictError extends ErrorHandler {
    constructor(message = "Slot already booked by another user", statusCode = 409) {
        super(message, statusCode);
        this.name = 'SlotConflictError';
        this.retryable = false; // Don't retry - business logic issue
    }
}

/**
 * Error for slot availability validation
 */
export class SlotValidationError extends ErrorHandler {
    constructor(message, statusCode = 400) {
        super(message, statusCode);
        this.name = 'SlotValidationError';
        this.retryable = false;
    }
}

export default ErrorHandler