import Booking from '../models/Booking.js';
import ShopDetails from '../models/ShopDetails.js';
import ErrorHandler from './errorhandler.js';

/**
 * ATOMIC SLOT AVAILABILITY CHECK
 * 
 * This function performs an atomic operation to reserve a slot for a barber.
 * Unlike the separate check + create pattern (which has race conditions),
 * this uses MongoDB's findOneAndUpdate to ensure atomicity.
 * 
 * If the update succeeds → slot was available and is now reserved
 * If the update fails → slot was already taken
 * 
 * NO RACE CONDITION WINDOW!
 */
export const atomicSlotCheck = async (barber_id, date, start_time, duration, session) => {
    try {
        // Calculate the slot range in minutes for comparison
        const [startHour, startMinute] = start_time.split(':').map(Number);
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = startInMinutes + duration;

        // Generate all 5-minute slots for this booking
        const bookingSlots = [];
        for (let i = startInMinutes; i < endInMinutes; i += 5) {
            const hours = Math.floor(i / 60);
            const mins = i % 60;
            bookingSlots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
        }

        // Atomic operation: Try to find a CONFLICTING booking
        // If found → slot is already taken
        // If NOT found → slot is available
        const queryOptions = {};
        if (session) queryOptions.session = session; // Only add session if it exists
        
        const conflictingBooking = await Booking.findOne(
            {
                $or: [
                    {
                        barber_id,
                        date: {
                            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                        },
                        'serviceProviders.0': { $exists: true }, // Has at least one provider (old structure)
                        'serviceProviders': {
                            $elemMatch: {
                                barber_id,
                                booking_slots: { $in: bookingSlots }
                            }
                        }
                    },
                    {
                        'serviceProviders.barber_id': barber_id,
                        date: {
                            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                        },
                        'serviceProviders': {
                            $elemMatch: {
                                barber_id,
                                booking_slots: { $in: bookingSlots }
                            }
                        }
                    }
                ],
                status: { $in: ['booked', 'arrived', 'completed'] } // Only active bookings
            },
            null,
            queryOptions
        );

        if (conflictingBooking) {
            // Slot is already booked
            return {
                available: false,
                reason: 'Time slot already booked',
                conflictingBookingId: conflictingBooking._id
            };
        }

        // All validations passed, slot is available
        return {
            available: true,
            bookingSlots: bookingSlots,
            startTime: start_time,
            endTime: `${String(Math.floor((startInMinutes + duration) / 60)).padStart(2, '0')}:${String((startInMinutes + duration) % 60).padStart(2, '0')}`,
            duration: duration
        };

    } catch (error) {
        console.error('Error in atomicSlotCheck:', error);
        throw new ErrorHandler(
            `Failed to check slot availability: ${error.message}`,
            500
        );
    }
};

/**
 * Validate shop operating hours and other business rules
 * This should still be done before the atomic check
 */
export const validateShopAvailability = async (barber_id, shopDetails, bookingDate, start_time, duration, session) => {
    try {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const bookingDayName = dayNames[bookingDate.getDay()];

        // Check if shop is closed on that day
        if (shopDetails.closing_days && shopDetails.closing_days.includes(bookingDayName)) {
            return { valid: false, reason: "Shop is closed on this day" };
        }

        // Check if shop is closed today
        if (bookingDayName === dayNames[new Date().getDay()] && !shopDetails.today_open) {
            return { valid: false, reason: "Shop is closed today" };
        }

        // Check opening hours
        const [startHour, startMinute] = start_time.split(':').map(Number);
        const bookingStart = startHour * 60 + startMinute;
        const bookingEnd = bookingStart + duration;

        const [openingHour, openingMinute] = (shopDetails.opening_hours?.start || '09:00').split(':').map(Number);
        const shopOpening = openingHour * 60 + openingMinute;

        let effectiveClosingTime = shopDetails.opening_hours?.end || '20:00';
        
        // Check half closing day
        if (shopDetails.half_closing_day === bookingDayName) {
            const [oHour, oMinute] = (shopDetails.opening_hours?.start || '09:00').split(':').map(Number);
            const halfDayCloseHour = oHour + 4;
            effectiveClosingTime = `${String(halfDayCloseHour).padStart(2, '0')}:${String(oMinute).padStart(2, '0')}`;
        }

        const [closingHour, closingMinute] = effectiveClosingTime.split(':').map(Number);
        const shopClosing = closingHour * 60 + closingMinute;

        if (bookingStart < shopOpening || bookingEnd > shopClosing) {
            return { valid: false, reason: "Booking time is outside shop hours" };
        }

        // Check tiffin time (lunch break)
        if (shopDetails.tiffin_time?.start && shopDetails.tiffin_time?.end) {
            const [tiffinStartHour, tiffinStartMinute] = shopDetails.tiffin_time.start.split(':').map(Number);
            const [tiffinEndHour, tiffinEndMinute] = shopDetails.tiffin_time.end.split(':').map(Number);
            const tiffinStart = tiffinStartHour * 60 + tiffinStartMinute;
            const tiffinEnd = tiffinEndHour * 60 + tiffinEndMinute;

            if (Math.max(bookingStart, tiffinStart) < Math.min(bookingEnd, tiffinEnd)) {
                return { valid: false, reason: "Booking overlaps with tiffin time (lunch break)" };
            }
        }

        // Check if booking is for past time (only for today)
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(bookingDate);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === today.getTime()) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;

            if (currentTimeInMinutes >= bookingStart) {
                return { valid: false, reason: "Cannot book for past time slots" };
            }
        }

        return { valid: true };

    } catch (error) {
        console.error('Error in validateShopAvailability:', error);
        throw new ErrorHandler(
            `Failed to validate shop availability: ${error.message}`,
            500
        );
    }
};

/**
 * Complete slot checking process
 * Combines business rule validation + atomic slot check
 */
export const checkSlotAvailability = async (barber_id, shopDetails, bookingDate, start_time, duration, session) => {
    // First validate business rules (these don't need atomicity)
    const validation = await validateShopAvailability(
        barber_id,
        shopDetails,
        bookingDate,
        start_time,
        duration,
        session
    );

    if (!validation.valid) {
        return { available: false, reason: validation.reason };
    }

    // Then perform atomic slot check (this needs atomicity)
    return await atomicSlotCheck(barber_id, bookingDate, start_time, duration, session);
};
