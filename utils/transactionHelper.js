import mongoose from 'mongoose';
import ErrorHandler from './errorhandler.js';

/**
 * Executes a function within a MongoDB transaction with automatic retry logic
 * Ensures ACID properties for multi-step operations
 * For local development (non-replica sets), executes without transactions
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @param {number} maxRetries - Maximum number of retries on transient errors
 * @returns {Promise} Result of the callback function
 */
export const startTransaction = async (callback, maxRetries = 3) => {
    // Check if transactions are supported (production/Atlas only)
    const isProduction = process.env.NODE_ENV === 'production';
    const isAtlas = process.env.MONGODB_URI?.includes('mongodb+srv');
    const supportsTransactions = isProduction || isAtlas;

    // For local MongoDB (development), execute without transactions
    if (!supportsTransactions) {
        console.log('📝 Executing without transactions (local MongoDB detected)');
        try {
            // Execute callback with null session - mongoose will handle normally
            const result = await callback(null);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Production: Use transactions with replica sets
    let lastError;
    let attempt = 0;

    while (attempt < maxRetries) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary',
                maxCommitTimeMS: 30000 // 30 seconds timeout
            });

            // Execute the callback with session
            const result = await callback(session);

            // Commit transaction
            await session.commitTransaction();
            return result;

        } catch (error) {
            // Rollback on error
            await session.abortTransaction();
            lastError = error;

            // Check if error is retryable
            if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) {
                attempt++;
                console.log(`Transaction attempt ${attempt} failed. Retrying...`);
                
                // Exponential backoff: 100ms, 200ms, 400ms
                const delay = Math.pow(2, attempt - 1) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Non-retryable error - throw immediately
            console.error('Transaction failed with non-retryable error:', error.message);
            throw error;

        } finally {
            await session.endSession();
        }
    }

    // Max retries exceeded
    throw new ErrorHandler(
        `Transaction failed after ${maxRetries} attempts: ${lastError.message}`,
        500
    );
};

/**
 * Helper to create a new session for manual transaction control
 * Use when you need more granular control over transaction lifecycle
 * 
 * @returns {Promise<ClientSession>}
 */
export const createSession = async () => {
    return await mongoose.startSession();
};

/**
 * Helper to safely end a session
 * 
 * @param {ClientSession} session
 */
export const endSession = async (session) => {
    if (session) {
        await session.endSession();
    }
};

/**
 * Wrapper for executing read-only operations within a transaction session
 * Useful for consistent reads within a transaction
 * 
 * @param {ClientSession} session - Mongoose session
 * @param {Function} callback - Async function to execute
 * @returns {Promise}
 */
export const readWithinTransaction = async (session, callback) => {
    return await callback(session);
};

/**
 * Wrapper for executing write operations within a transaction session
 * Automatically propagates session to write operations
 * 
 * @param {ClientSession} session - Mongoose session
 * @param {Function} callback - Async function to execute writes
 * @returns {Promise}
 */
export const writeWithinTransaction = async (session, callback) => {
    return await callback(session);
};
