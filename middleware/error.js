import ErrorHandler from "../utils/errorhandler.js";

export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    
    // Log error for debugging (remove in production)
    // console.log('Error caught in middleware:', {
    //     name: err.name,
    //     message: err.message,
    //     statusCode: err.statusCode,
    //     stack: err.stack
    // });
    
    // Wrong Mongodb id error
    if (err.name === "CastError") {
        // console.log(err);
        const message = `Resource not found, Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        // console.log(err)
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => val.message);
        err = new ErrorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid. Try again`;
        err = new ErrorHandler(message, 400)
    }

    // JWT Expire error
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is Expired. Try again`;
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })
}