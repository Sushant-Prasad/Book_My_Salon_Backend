import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ErrorHandler from "../utils/errorhandler.js";

// Middleware to check if the user is authenticated
const isAuthenticated = async (req, res, next) => {
    let token;

    // Check if token is present in the request headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // If no token is found, return an error response
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user associated with the token
        // req.user = await User.findById(decoded.id).select("-password");
        req.user = await User.findById(decoded.id)
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

// Alternative authentication middleware using cookies
// export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
//     const { token } = req.cookies;

//     if (!token) {
//         return next(new ErrorHandler("Please login to access this resource", 401));
//     }

//     const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = await User.findById(decodedData.id);
    
//     if (!req.user) {
//         return next(new ErrorHandler("User not found", 404));
//     }

//     next();
// });

export const isAdmin = (req, res, next) => {
    
    if (req.user.role !== "admin") {
        return next(new ErrorHandler("You are not allowed to access this resource", 403));
    }   
    next();
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};

// Export the middleware
export default isAuthenticated;