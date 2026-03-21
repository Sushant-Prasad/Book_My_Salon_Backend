import Booking from '../../models/Booking.js';
import mongoose from 'mongoose';

// Auto-cancel no-show bookings (called by external cron service)
const autoCancelNoShowBookings = async () => {
    try {
        // Ensure MongoDB connection is ready
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000, // 5 second timeout
            });
        }

        // Get current time in IST
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const currentDate = istTime.toISOString().split('T')[0];
        const currentHour = istTime.getHours();
        const currentMinute = istTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Grace period in minutes (10 minutes after booking start time)
        const gracePeriodMinutes = 5;

        // Find today's bookings with status 'booked' that have start_time
        // Use lean() for better performance
        const bookings = await Booking.find({
            date: currentDate,
            status: 'booked',
            'serviceProviders.start_time': { $exists: true, $ne: null }
        }).lean().maxTimeMS(5000); // 5 second timeout for query

        const bookingsToDelete = [];

        for (const booking of bookings) {
            // Check each service provider's start time
            for (const provider of booking.serviceProviders) {
                if (provider.start_time) {
                    const [startHour, startMinute] = provider.start_time.split(':').map(Number);
                    const bookingStartTimeInMinutes = startHour * 60 + startMinute;
                    const timeDifference = currentTimeInMinutes - bookingStartTimeInMinutes;

                    // If current time is more than grace period past the start time
                    if (timeDifference > gracePeriodMinutes) {
                        bookingsToDelete.push({
                            id: booking._id,
                            customerName: booking.customerdetails?.customer_name,
                            date: booking.date,
                            startTime: provider.start_time,
                            timePast: timeDifference
                        });
                        break; // No need to check other providers for this booking
                    }
                }
            }
        }

        // Batch delete all bookings at once
        let deletedCount = 0;
        if (bookingsToDelete.length > 0) {
            const idsToDelete = bookingsToDelete.map(b => b.id);
            const result = await Booking.deleteMany({ _id: { $in: idsToDelete } });
            deletedCount = result.deletedCount;
            // console.log(`Auto-deletion completed: ${deletedCount} bookings deleted at ${istTime.toLocaleTimeString()}`);
        }

        return {
            success: true,
            deletedCount: deletedCount,
            deletedBookings: bookingsToDelete,
            executedAt: istTime.toLocaleString('en-IN')
        };
    } catch (error) {
        console.error('Error in auto-cancel job:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// API endpoint handler for Vercel
export default async function handler(req, res) {
    // Security: Check for secret key in headers
    const cronSecret = req.headers['x-cron-secret'];
    
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
        // console.log('Unauthorized auto-cancel attempt');
        return res.status(401).json({ 
            success: false,
            error: 'Unauthorized - Invalid or missing cron secret' 
        });
    }

    // Only allow GET or POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed - Use GET or POST' 
        });
    }

    try {
        const result = await autoCancelNoShowBookings();
        
        return res.status(200).json({
            success: true,
            message: 'Auto-cancel job executed successfully',
            data: result
        });
    } catch (error) {
        console.error('Auto-cancel endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
