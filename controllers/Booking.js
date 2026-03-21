import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import Booking from "../models/Booking.js";
import SpamList from "../models/SpamList.js";
import ShopDetails from "../models/ShopDetails.js";
import User from "../models/User.js";
import ErrorHandler from "../utils/errorhandler.js";
import { isSlotAvailable } from "../utils/timeSlotManager.js";
import {  isValidBookingDate, getBookingTimeRange } from "../utils/dateUtils.js";
import { getPaginationOptions, formatPaginationResponse } from "../utils/dbUtils.js";
import mongoose from 'mongoose';



// Helper function to get next daily counter for temporary customer names
const getNextDailyCounter = async (bookingDate) => {
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Count bookings for the day
    const count = await Booking.countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Return 4-digit number starting from 0000
    return String(count).padStart(4, '0');
};

// Create a new booking
export const createBooking = catchAsyncErrors(async (req, res, next) => {
    const { serviceProviders, date } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    

    if (!serviceProviders || serviceProviders.length === 0 || !date) {
        return next(new ErrorHandler("Service providers and date are required", 400));
    }

    const bookingDate = new Date(date);

    // Validate booking date
    if (!isValidBookingDate(bookingDate)) {
        return next(new ErrorHandler("Booking allowed only for today and next 2 days", 400));
    }

    // Determine customer details based on user role
    let customerDetails;
    
    if (userRole === 'customer') {
        // Real customer booking - fetch user details
        const customer = await User.findById(userId).select('name email phone profileUrl');
        if (!customer) {
            return next(new ErrorHandler("Customer not found", 404));
        }

        // Check if customer is spammed by any of the barbers
        const barberIds = serviceProviders.map(sp => sp.barber_id);
        const isSpammed = await SpamList.findOne({ 
            barber_id: { $in: barberIds }, 
            customer_phone: customer.phone 
        });

        if (isSpammed) {
            return next(new ErrorHandler("You are blocked by one of the barbers", 403));
        }

        customerDetails = {
            customer_id: customer._id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_email: customer.email,
            customer_profileUrl: customer.profileUrl
        };
    } else {
        // Barber or Admin booking - generate temporary customer details
        const dailyCounter = await getNextDailyCounter(bookingDate);
        
        customerDetails = {
            customer_id: new mongoose.Types.ObjectId(),
            customer_name: dailyCounter,
            customer_phone: '0123456789',
            customer_email: '',
            customer_profileUrl: ''
        };
    }

    // Validate each service provider
    for (const provider of serviceProviders) {
        const { barber_id, services, start_time, service_time } = provider;

        if (!barber_id || !services || services.length === 0 || !start_time || !service_time) {
            return next(new ErrorHandler("Each service provider must have barber_id, services, start_time, and service_time", 400));
        }

        // Get shop details for this barber
        const shopDetails = await ShopDetails.findOne({ barber_id });
        if (!shopDetails) {
            return next(new ErrorHandler(`Shop details not found for barber ${barber_id}`, 404));
        }

        // Validate services exist in shop
        const serviceMap = new Map(shopDetails.services.map(s => [s.name.trim().toLowerCase(), s.duration]));
        for (const service of services) {
            if (!serviceMap.has(service.trim().toLowerCase())) {
                return next(new ErrorHandler(`Service "${service}" not available for this barber`, 400));
            }
        }

        // Check if the slot is available for this barber
        const isAvailable = await isSlotAvailable(barber_id, shopDetails, bookingDate, start_time, service_time);
        if (!isAvailable.available) {
            return next(new ErrorHandler(`Slot not available for barber: ${isAvailable.reason}`, 400));
        }
    }

    // Create booking with serviceProviders array
    const booking = await Booking.create({
        customerdetails: customerDetails,
        serviceProviders: serviceProviders,
        date: bookingDate,
        status: userRole === "customer" ? 'booked' : "completed",
        isOffline: userRole !== 'customer'
    });

    // Populate barber details
    const populatedBooking = await Booking.findById(booking._id)
        .populate('serviceProviders.barber_id', 'name email phone profileUrl');
    
    res.status(201).json({
        success: true,
        message: "Booking created successfully bookingId-" + customerDetails?.customer_name,
        data: populatedBooking
    });
});

export const createAndUpdateOfflineBooking = catchAsyncErrors(async (req, res, next) => {
    const {  serviceProviders, date, customer_name, customer_phone, discount_applied, total_amount_paid} = req.body;
    if (!serviceProviders || serviceProviders.length === 0 || !date || !customer_name || !customer_phone) {
        return next(new ErrorHandler("All fields are required", 400));
    }
    const bookingDate = new Date(date);

    // Validate booking date
    if (!isValidBookingDate(bookingDate)) {
        return next(new ErrorHandler("Booking allowed only for today and next 2 days", 400));
    }

    // Create booking
    const booking = await Booking.create({
        customerdetails: {
            customer_id: new mongoose.Types.ObjectId(),
            customer_name,
            customer_phone,
            customer_email: '',
            customer_profileUrl: ''
        },
        serviceProviders,
        date: bookingDate,
        discount_applied,
        total_amount_paid,
        status: 'completed',
        payment: 'paid',
        isOffline: true
    });

    res.status(201).json({
        success: true,
        message: "Offline Booking created successfully",
        data: booking
    });
});




export const bookedSlotes = catchAsyncErrors(async (req, res, next) => {
    const barbers = await User.find({ role: 'barber' }).select('_id name profileUrl phone');

    if (barbers.length === 0) {
        return next(new ErrorHandler("No barbers found", 404));
    }

    // Get current date in Asia/Kolkata timezone properly
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Create today's date at midnight in India time
    const today = new Date(indiaTime.getFullYear(), indiaTime.getMonth(), indiaTime.getDate());
    
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const nextSecDay = new Date(today);
    nextSecDay.setDate(today.getDate() + 2);


    const barbersData = [];

    for (const barber of barbers) {
        const barber_id = barber._id;

        // Updated queries to handle both old and new booking structures
        const validStatuses = ['booked', 'arrived', 'completed'];
        const [todayBooking, nextDayBooking, nextSecDayBooking] = await Promise.all([
            Booking.find({
                $or: [
                    { barber_id, date: { $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()), $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) }, status: { $in: validStatuses } },
                    { 'serviceProviders.barber_id': barber_id, date: { $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()), $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) }, status: { $in: validStatuses } }
                ]
            }),
            Booking.find({
                $or: [
                    { barber_id, date: { $gte: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()), $lt: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate() + 1) }, status: { $in: validStatuses } },
                    { 'serviceProviders.barber_id': barber_id, date: { $gte: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()), $lt: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate() + 1) }, status: { $in: validStatuses } }
                ]
            }),
            Booking.find({
                $or: [
                    { barber_id, date: { $gte: new Date(nextSecDay.getFullYear(), nextSecDay.getMonth(), nextSecDay.getDate()), $lt: new Date(nextSecDay.getFullYear(), nextSecDay.getMonth(), nextSecDay.getDate() + 1) }, status: { $in: validStatuses } },
                    { 'serviceProviders.barber_id': barber_id, date: { $gte: new Date(nextSecDay.getFullYear(), nextSecDay.getMonth(), nextSecDay.getDate()), $lt: new Date(nextSecDay.getFullYear(), nextSecDay.getMonth(), nextSecDay.getDate() + 1) }, status: { $in: validStatuses } }
                ]
            })
        ]);

        // Extract booking slots for this specific barber from both old and new structure
        const extractBarberSlots = (bookings) => {
            const slots = [];
            bookings.forEach(booking => {
                if (booking.serviceProviders && booking.serviceProviders.length > 0) {
                    // New structure: find this barber in serviceProviders array
                    const barberProvider = booking.serviceProviders.find(
                        provider => provider.barber_id.toString() === barber_id.toString()
                    );
                    if (barberProvider && barberProvider.booking_slots) {
                        slots.push(...barberProvider.booking_slots);
                    }
                } else if (booking.booking_slots) {
                    // Old structure: direct booking_slots
                    slots.push(...booking.booking_slots);
                }
            });
            return slots;
        };

        const todayBookedSlots = extractBarberSlots(todayBooking);
        const nextDayBookedSlots = extractBarberSlots(nextDayBooking);
        const nextSecDayBookedSlots = extractBarberSlots(nextSecDayBooking);

        const barberData = {
            _id: barber_id,
            name: barber.name,
            photoUrl: barber.profileUrl,
            phone: barber.phone,
            today: todayBookedSlots,
            next_day: nextDayBookedSlots,
            next_second_day: nextSecDayBookedSlots
        };

        barbersData.push(barberData); // Use push instead of index assignment

    }
    const shopDetails = await ShopDetails
        .find({ barber_id: { $in: barbers.map(b => b._id) } })
        .select('barber_id phone opening_hours closing_days half_closing_day slot_interval services shop_address today_open tiffin_time');


    res.status(200).json({
        success: true,
        data: barbersData,
        shopDetails: shopDetails,
        message: "Booked slots fetched successfully"
    });

});

// Get customer's bookings
export const getCustomerBookings = catchAsyncErrors(async (req, res, next) => {
    const customer_id = req.user.id;
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);

    const thirdDay = new Date(today);
    thirdDay.setDate(today.getDate() + 2);
    thirdDay.setHours(23, 59, 59, 999);

    const query = {
        'customerdetails.customer_id': customer_id,
        date: { $gte: today, $lte: thirdDay }
    };
    
    const bookings = await Booking.find(query)
        .populate('serviceProviders.barber_id', 'name profileUrl')
        .select('_id date status customerdetails payment total_amount_paid serviceProviders')
        .sort({ date: -1, start_time: -1 });

    res.status(200).json({
        success: true,
        data: bookings
    });
});

// Get barber's bookings
export const getBarberBookings = catchAsyncErrors(async (req, res, next) => {
    const barber_id = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const { start: today, end: thirdDay } = getBookingTimeRange();
    const { skip, limit: parsedLimit, page: parsedPage } = getPaginationOptions(page, limit);

    // Query for bookings where barber is in serviceProviders array
    const query = { 
        'serviceProviders.barber_id': barber_id,
        date: { $gte: today, $lte: thirdDay },
        payment: { $ne: 'paid' }
    };
    
    if (status) {
        query.status = status;
    }
   
    // Parallel execution for better performance
    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate('serviceProviders.barber_id', 'name profileUrl')
            .sort({ date: 1, 'serviceProviders.start_time': 1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        Booking.countDocuments(query)
    ]);

    const response = formatPaginationResponse(bookings, total, parsedPage, parsedLimit);
    
    res.status(200).json({
        success: true,
        data: response,
        pagination: response.pagination
    });
});

export const getBarberBookingsWithDate = catchAsyncErrors(async (req, res, next) => {
    // Handle both GET (query params) and POST (body) requests
    const { date, page = 1, limit = 10 } = req.method === 'GET' ? req.query : req.body;
    // console.log("Fetching bookings for barber:",  "on date:", date);  
    // console.log("Request data for barber bookings with date:", { barber_id, date, page, limit }, "Method:", req.method);
    
    const query = {};
    
    // to filter by date
    if (date) {
        const bookingDate = new Date(date);
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = {
            $gte: startOfDay,
            $lte: endOfDay
        };
    }
    const skip = (page - 1) * limit;
    
    const [bookings, total] = await Promise.all([
        Booking.find({ ...query})
            .populate('customerdetails.customer_id', 'name phone email')
            .populate('serviceProviders.barber_id', 'name gender')
            .sort({ date: 1, 'serviceProviders.start_time': 1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Booking.countDocuments({ ...query })
    ]);

    // console.log("Fetched bookings:", bookings, total);

    res.status(200).json({
        success: true,
        data: {
            bookings,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_bookings: total
            }
        }
    });
});

export const updateBooking = catchAsyncErrors(async (req, res, next) => {
    const { bookingId } = req.params;
    let {barber_id, customer_name,  customer_phone, discount_applied, 
payment_status, total_amount_paid, serviceProviders} = req.body;

    const updateData = {};

    if (customer_name) updateData['customerdetails.customer_name'] = customer_name;
    if (customer_phone) updateData['customerdetails.customer_phone'] = customer_phone;
    if (discount_applied) updateData.discount_applied = discount_applied;
    if (total_amount_paid) updateData.total_amount_paid = total_amount_paid;
    if (payment_status) updateData.payment = payment_status;
    
    // Handle serviceProviders update - calculate end_time and booking_slots
    if (serviceProviders) {
        const processedProviders = serviceProviders.map(provider => {
            const processedProvider = { ...provider };
            
            // Only calculate if start_time exists (online booking)
            if (provider.start_time && provider.service_time) {
                // Calculate end time
                const [hours, minutes] = provider.start_time.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + provider.service_time;

                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                processedProvider.end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

                // Generate 5-minute slots
                processedProvider.booking_slots = [];
                for (let i = startMinutes; i < endMinutes; i += 5) {
                    const slotHours = Math.floor(i / 60);
                    const slotMins = i % 60;
                    processedProvider.booking_slots.push(`${String(slotHours).padStart(2, '0')}:${String(slotMins).padStart(2, '0')}`);
                }
            }
            
            return processedProvider;
        });
        
        updateData.serviceProviders = processedProviders;
    }

    if (barber_id) updateData.barber_id = barber_id;
        // check IF payment status is pending then total amount paid should be 0
    if(payment_status === "pending"){
        updateData.total_amount_paid = 0;
        updateData.discount_applied = 0;
    }
    if(payment_status === "paid"){
        updateData.status = "completed";
    }
    
    const customer = await User.findOne({ phone: customer_phone });
    if (!customer) {
        updateData['customerdetails.customer_id'] = new mongoose.Types.ObjectId();
        updateData['customerdetails.customer_email'] = '';
    } else {
        updateData['customerdetails.customer_id'] = customer._id;
        updateData['customerdetails.customer_email'] = customer.email;
    }

    if(!updateData.barber_id && !updateData['customerdetails.customer_name'] && !updateData['customerdetails.customer_phone'] && 
       !updateData.discount_applied && !updateData.payment && !updateData.total_amount_paid && !updateData.serviceProviders){
        return next(new ErrorHandler("No valid fields to update", 400));
    }
    
    const booking = await Booking.findByIdAndUpdate
    (bookingId, updateData, { new: true });
    if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: booking
    });
}
);



// Cancel booking
export const cancelBooking = catchAsyncErrors(async (req, res, next) => {
    const { bookingId } = req.params;
    const { payment_status } = req.body;
    // console.log("Cancel booking request:",  req.params, payment_status );
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
    }

    if (payment_status === "paid") {
        return next(new ErrorHandler("Cannot cancel a paid booking", 400));
    }

    // Check authorization
    if (req.user.role !== 'admin' && booking.customerdetails.customer_id.toString() !== userId) {
        return next(new ErrorHandler("Not authorized to cancel this booking", 403));
    }

    // Optimized time validation
    // const now = getIndiaTime();
    // const bookingDateTime = new Date(booking.date);
    // const [hours, minutes] = String(booking.start_time).split(':').map(Number);
    // bookingDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    // const timeDiffMinutes = Math.floor((bookingDateTime.getTime() - now.getTime()) / (1000 * 60));

    // if (timeDiffMinutes < 5) {
    //     return next(new ErrorHandler("Booking can only be cancelled at least 5 minutes in advance", 400));
    // }

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking
    });
});

// Update booking status with unknown customer
export const updateBookingStatus = catchAsyncErrors(async (req, res, next) => {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    

    if (!status) {
        return next(new ErrorHandler("Status is required", 400));
    }

    // Validate status
    const validStatuses = ['booked', 'arrived', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
    }

    // Check if user has permission to update (handle both old and new structure)
    let isAuthorized = false;

    if(req.user.role === 'admin'){
        isAuthorized = true;
    }else{

        if (booking.barber_id && booking.barber_id.toString() === userId) {
            // Old structure: direct barber_id
            isAuthorized = true;
        } else if (booking.serviceProviders && booking.serviceProviders.length > 0) {
            // New structure: check if user is one of the service providers
            isAuthorized = booking.serviceProviders.some(
                provider => provider.barber_id.toString() === userId
            );
        }
        
    }
    if (!isAuthorized) {
        return next(new ErrorHandler("Not authorized to update this booking", 403));
    }
    

    // Efficiently update booking with unknown customer details
    const updateData = {
        status
    };

    await Booking.findByIdAndUpdate(bookingId, updateData);

    res.status(200).json({
        success: true,
        message: `Booking status:${status} updated successfully`
    });
});

// Make available current slot booking 
export const makeSlotAvialable = catchAsyncErrors(async (req, res, next) => {
    const { bookingId } = req.params;
    const { payment_status } = req.body;

    if (payment_status === "paid") {
        return next(new ErrorHandler("Cannot make slot available for a paid booking", 400));
    }

    const booking = await Booking.findByIdAndDelete(bookingId).lean();
    if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Slot has been made available successfully"
    });
});

// // Auto-cancel no-show bookings (called by cron job)
// export const autoCancelNoShowBookings = async () => {
//     try {
//         // Get current time in IST
//         const now = new Date();
//         const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//         const currentDate = istTime.toISOString().split('T')[0];
//         const currentHour = istTime.getHours();
//         const currentMinute = istTime.getMinutes();
//         const currentTimeInMinutes = currentHour * 60 + currentMinute;

//         // Grace period in minutes (10 minutes after booking start time)
//         const gracePeriodMinutes = 10;

//         // Find today's bookings with status 'booked' that have start_time
//         const bookings = await Booking.find({
//             date: currentDate,
//             status: 'booked',
//             'serviceProviders.start_time': { $exists: true, $ne: null }
//         });

//         const cancelledBookings = [];

//         for (const booking of bookings) {
//             // Check each service provider's start time
//             for (const provider of booking.serviceProviders) {
//                 if (provider.start_time) {
//                     const [startHour, startMinute] = provider.start_time.split(':').map(Number);
//                     const bookingStartTimeInMinutes = startHour * 60 + startMinute;
//                     const timeDifference = currentTimeInMinutes - bookingStartTimeInMinutes;

//                     // If current time is more than grace period past the start time
//                     if (timeDifference > gracePeriodMinutes) {
//                         // Cancel the booking
//                         booking.status = 'cancelled';
//                         await booking.save();
                        
//                         cancelledBookings.push({
//                             bookingId: booking._id,
//                             customerName: booking.customer_name,
//                             date: booking.date,
//                             startTime: provider.start_time,
//                             timePast: timeDifference
//                         });
                        
//                         console.log(`Auto-cancelled booking ${booking._id} for ${booking.customer_name} - ${timeDifference} min past start time`);
//                         break; // No need to check other providers for this booking
//                     }
//                 }
//             }
//         }

//         if (cancelledBookings.length > 0) {
//             console.log(`Auto-cancellation completed: ${cancelledBookings.length} bookings cancelled at ${istTime.toLocaleTimeString()}`);
//         }

//         return {
//             success: true,
//             cancelledCount: cancelledBookings.length,
//             cancelledBookings
//         };
//     } catch (error) {
//         console.error('Error in auto-cancel job:', error);
//         return {
//             success: false,
//             error: error.message
//         };
//     }
// };

// // Delete today's cancelled bookings (called by cron job at 9 PM)
// export const deleteTodayCancelledBookings = async () => {
//     try {
//         // Get current date in IST
//         const now = new Date();
//         const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//         const currentDate = istTime.toISOString().split('T')[0];

//         // Delete all today's cancelled bookings
//         const result = await Booking.deleteMany({
//             date: currentDate,
//             status: 'cancelled'
//         });

//         if (result.deletedCount > 0) {
//             console.log(`Cleanup completed: ${result.deletedCount} cancelled booking(s) deleted at ${istTime.toLocaleTimeString()}`);
//         }

//         return {
//             success: true,
//             deletedCount: result.deletedCount
//         };
//     } catch (error) {
//         console.error('Error in cleanup job:', error);
//         return {
//             success: false,
//             error: error.message
//         };
//     }
// };