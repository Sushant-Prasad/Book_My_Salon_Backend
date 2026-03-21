import User from "../models/User.js";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import mongoose from 'mongoose';
import { Review } from "../models/Review.js";
import { getPaginationOptions } from "../utils/dbUtils.js";
import Booking from "../models/Booking.js";

export const createReview = catchAsyncErrors(async (req, res, next) => {
    const { barberId, rating, comment } = req.body;
    const userId = req.user._id;
    const phone = req.user.phone

    if(!phone){
        return next(new ErrorHandler("Please update your phone number in profile to post a review", 400));
    }

    const findUserBookings = await Booking.findOne({
        'customerdetails.customer_phone': phone,
        payment: 'paid',
    });

    if(!findUserBookings){
        return next(new ErrorHandler("You can only review barbers if you have taken any services", 400));
    }

        
    let review;
    const user = await User.findById(userId);


    if (!userId)
        return next(new ErrorHandler(404, "Not Logged In"));

    if (!barberId || !rating) {
        return next(new ErrorHandler("Barber ID and rating are required", 400));
    }

    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barber') {
        return next(new ErrorHandler("Barber not found", 404));
    }

    if(user?.spam === true){
        return next(new ErrorHandler("You are restricted from posting reviews", 403));
    }
    const existingReview = await Review.findOne({ barber: barberId, user: userId });
    if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
        await existingReview.save();
    }else{
        review = await Review.create({
            barber: barberId,
            user: userId,
            rating,
            comment
        });
    }


    res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review
    });
});

export const getYourReview = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    if (!userId)
        return next(new ErrorHandler(404, "Not Logged In"));

    const review = await Review.find({ user: userId })
        .populate('barber', 'name profileUrl')
        .sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        data: review
    });
});

export const getBarberReviews = catchAsyncErrors(async (req, res, next) => {
    const { barberId } = req.params;
    const {page = 1, limit = 10} = req.query;
    const { skip, limit: parsedLimit, page: parsedPage } = getPaginationOptions(page, limit);

    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barber') {
        return next(new ErrorHandler("Barber not found", 404));
    }
    const reviews = await Review.find({ barber: barberId })
        .populate('user', 'name profileUrl')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit);
        

    res.status(200).json({
        success: true,
        data: reviews,
        pagination: reviews.pagination
    });
});

export const getAllReviews = catchAsyncErrors(async (req, res, next) => {
    const { searchWord='', barberId, rating, page = 1,  limit = 10} = req.query;
    const { skip, limit: parsedLimit  } = getPaginationOptions(page, limit);
    
    const reviews = await Review.find({
            comment: { $regex: searchWord, $options: 'i' },
            ...(barberId ? { barber: barberId } : {}),
            ...(rating ? { rating: {$lte: Number(rating)} } : {})
    })
        .populate('user', 'name profileUrl')  
        .populate('barber', 'name profileUrl')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit);

    res.status(200).json({
        success: true,
        data: reviews,
        pagination: reviews.pagination
    });
});

export const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId); 
    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Check if the review belongs to the user
    if (review.user.toString() !== userId.toString()) {
        return next(new ErrorHandler("You are not authorized to delete this review", 403));
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
        success: true,
        message: "Review deleted successfully"
    });
});

export const EveryBarberRating = catchAsyncErrors(async (req, res, next) => {
    // Get all barbers
    const barbers = await User.find({ role: 'barber' }).select('name profileUrl');
    
    if (!barbers || barbers.length === 0) {
        return res.status(200).json({
            success: true,
            data: []
        });
    }
    // Calculate average rating for each barber
    const ratingsData = await Promise.all(
        barbers.map(async (barber) => {
            try {
                const reviews = await Review.find({ barber: barber._id.toString() });
                
                let averageRating = 0;
                if (reviews && reviews.length > 0) {
                    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                    averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
                }
                
                return {
                    barberId: barber._id,
                    barberName: barber.name || 'Unknown',
                    profileUrl: barber.profileUrl || null,
                    rating: averageRating,
                    totalReviews: reviews ? reviews.length : 0
                };
            } catch (error) {
                console.error(`Error processing barber ${barber._id}:`, error);
                return {
                    barberId: barber._id,
                    barberName: barber.name || 'Unknown',
                    profileUrl: barber.profileUrl || null,
                    rating: 0,
                    totalReviews: 0
                };
            }
        })
    );
    
    res.status(200).json({
        success: true,
        data: ratingsData
    });
});
