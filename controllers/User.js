import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import ShopDetails from "../models/ShopDetails.js";
import User from "../models/User.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendToken, { deleteFilesFromCloudinary } from "../utils/features.js";
import { getPaginationOptions, formatPaginationResponse } from "../utils/dbUtils.js";


export const getMyProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

export const newUser = catchAsyncErrors(async (req, res,next) => {
    const { name, email, gender, role, phone, profileUrl, DOB } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new ErrorHandler('username already exists', 400));
    }
    if(!name || !email || !role){
        return next(new ErrorHandler("Please Enter Admin ID, Username & Password", 400))
    }
    const user = await User.create({
        name,
        email,
        role,
        gender,
        phone,
        profileUrl,
        DOB,
    });
    
    

    sendToken(res, user, 201, "User created")
})

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if(!user ){
        return next(new ErrorHandler("you don't have account. please singup first", 400))
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
})

export const logout = catchAsyncErrors(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out"
    })
});


export const removeBarber = catchAsyncErrors(async (req, res, next) => {
    const { barberId } = req.params;
    
    // Parallel queries for better performance
    const [barber, shopDetails] = await Promise.all([
        User.findById(barberId),
        ShopDetails.findOne({ barber_id: barberId })
    ]);
    
    if (!barber || barber.role !== 'barber') {
        return next(new ErrorHandler("Barber not found", 404));
    }
    
    if (!shopDetails) {
        return next(new ErrorHandler("Shop details not found for this barber", 404));
    }
    
    // Clean up operations in parallel
    await Promise.all([
        shopDetails.profileUrl?.public_id ? deleteFilesFromCloudinary(shopDetails.profileUrl.public_id) : Promise.resolve(),
        ShopDetails.deleteOne({ barber_id: barberId }),
        barber.deleteOne()
    ]);
    
    res.status(200).json({
        success: true,
        message: "Barber removed successfully"
    });
});

// Get user login activity
export const getUserActivity = catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('name email lastLogin createdAt role');
    
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    
    res.status(200).json({
        success: true,
        data: {
            user: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
            accountCreated: user.createdAt,
            daysActive: user.lastLogin ? Math.floor((new Date() - user.lastLogin) / (1000 * 60 * 60 * 24)) : null
        }
    });
});

// Get all users with their last login info (admin only)
export const getAllUsersActivity = catchAsyncErrors(async (req, res, next) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler("Access denied. Admin only.", 403));
    }
    
    const { page = 1, limit = 10, role } = req.query;
    const { skip, limit: parsedLimit, page: parsedPage } = getPaginationOptions(page, limit);
    
    let filter = {};
    if (role && role !== 'all') {
        filter.role = role;
    }
    
    // Parallel execution for better performance
    const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .select('name email role lastLogin createdAt spam')
            .sort({ lastLogin: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        User.countDocuments(filter)
    ]);
    
    // Process users data efficiently
    const usersWithActivity = users.map(user => {
        const daysSinceLogin = user.lastLogin ? 
            Math.floor((new Date() - user.lastLogin) / (1000 * 60 * 60 * 24)) : null;
        
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
            accountCreated: user.createdAt,
            isActive: user.lastLogin && daysSinceLogin < 7, // Active within 7 days
            daysSinceLogin,
            isSpam: user.spam
        };
    });
    
    const response = formatPaginationResponse(usersWithActivity, totalUsers, parsedPage, parsedLimit);
    
    res.status(200).json({
        success: true,
        data: response.data,
        pagination: response.pagination
    });
});