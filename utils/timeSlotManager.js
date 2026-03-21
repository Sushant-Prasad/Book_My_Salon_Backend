import Booking from "../models/Booking.js";
import ShopDetails from "../models/ShopDetails.js";


export const isSlotAvailable= async (barber_id, shopDetails, date, start_time, duration) => {

    const openingHours = shopDetails.opening_hours;
    const closingDays = shopDetails.closing_days;
    const tiffinTime = shopDetails.tiffin_time;
    const half_closing_day = shopDetails.half_closing_day;

    // find the day name of booking date
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bookingDayName = dayNames[date.getDay()];
    // Check if the shop is closed on that day
    if (closingDays.includes(bookingDayName)) {
        return { available: false, reason: "Shop is closed on this day" };
    }
    // Determine effective closing time for half closing day
    let effectiveClosingTime = openingHours.end;
    if (half_closing_day === bookingDayName) {
        const [openHour, openMinute] = openingHours.start.split(":").map(Number);
        const halfDayCloseHour = openHour + 4; // Assuming half day means 4 hours after opening
        effectiveClosingTime = `${String(halfDayCloseHour).padStart(2, '0')}:${String(openMinute).padStart(2, '0')}`;
    }


    // Check booking time against opening hours
    const [startHour, startMinute] = start_time.split(":").map(Number);
    const bookingStart = startHour * 60 + startMinute;
    const bookingEnd = bookingStart + duration;
    const [openingHour, openingMinute] = openingHours.start.split(":").map(Number);
    const shopOpening = openingHour * 60 + openingMinute;
    const [closingHour, closingMinute] = effectiveClosingTime.split(":").map(Number);
    const shopClosing = closingHour * 60 + closingMinute;
    let available, reason;
    
    // console.log("Time validation:", {
    //     requestedTime: start_time,
    //     bookingStart: bookingStart,
    //     bookingEnd: bookingEnd,
    //     shopOpening: shopOpening,
    //     shopClosing: shopClosing,
    //     duration: duration
    // });
    
    if (bookingStart < shopOpening || bookingEnd > shopClosing) {
        // console.log("❌ Booking time is outside shop hours");
        return { available: false, reason: "Booking time is outside shop hours" };
    }

    // Check if booking time is in the past (only for today's bookings)
    const now = new Date();
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    
    if (bookingDate.getTime() === today.getTime()) {
        // It's today's booking, check if time has passed
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        // console.log("Past time check:", {
        //     currentTime: `${currentHour}:${String(currentMinute).padStart(2, '0')}`,
        //     currentTimeInMinutes,
        //     bookingStart,
        //     isInPast: currentTimeInMinutes >= bookingStart
        // });
        
        if (currentTimeInMinutes >= bookingStart) {
            // console.log("❌ Cannot book for past time slots");
            return { available: false, reason: "Cannot book for past time slots" };
        }
    }

    // Check if booking overlaps with tiffin time
    if (tiffinTime && tiffinTime.start && tiffinTime.end) {
        const [tiffinStartHour, tiffinStartMinute] = tiffinTime.start.split(":").map(Number);
        const [tiffinEndHour, tiffinEndMinute] = tiffinTime.end.split(":").map(Number);
        const tiffinStart = tiffinStartHour * 60 + tiffinStartMinute;
        const tiffinEnd = tiffinEndHour * 60 + tiffinEndMinute;
        
        // console.log("Tiffin time check:", {
        //     tiffinTime: `${tiffinTime.start}-${tiffinTime.end}`,
        //     tiffinStart,
        //     tiffinEnd,
        //     bookingStart,
        //     bookingEnd,
        //     overlapsWithTiffin: Math.max(bookingStart, tiffinStart) < Math.min(bookingEnd, tiffinEnd)
        // });
        
        if (Math.max(bookingStart, tiffinStart) < Math.min(bookingEnd, tiffinEnd)) {
            // console.log("❌ Booking overlaps with tiffin time (lunch break)");
            return { available: false, reason: "Booking overlaps with tiffin time (lunch break)"};
        }
    }

    // Get all bookings for the barber on the given date (both old and new structure)
    const bookings = await Booking.find({ 
        $or: [
            { barber_id, date },
            { 'serviceProviders.barber_id': barber_id, date }
        ]
    });
    // console.log("Existing bookings on", date, bookings);

    // Check for overlapping bookings

    for (const booking of bookings) {
        // Handle both old and new booking structures
        let barberSlots = [];
        
        if (booking.serviceProviders && booking.serviceProviders.length > 0) {
            // New structure: find this specific barber in serviceProviders array
            const barberProvider = booking.serviceProviders.find(
                provider => provider.barber_id.toString() === barber_id.toString()
            );
            
            // Only add to slots if start_time exists (online bookings have start_time, offline don't)
            if (barberProvider && barberProvider.start_time && barberProvider.service_time) {
                barberSlots.push({
                    start_time: barberProvider.start_time,
                    service_time: barberProvider.service_time
                });
            }
        } else if (booking.start_time && booking.service_time) {
            // Old structure: direct fields
            barberSlots.push({
                start_time: booking.start_time,
                service_time: booking.service_time
            });
        }
        
        // Check each slot for this barber
        for (const slot of barberSlots) {
            const [bStartHour, bStartMinute] = slot.start_time.split(":").map(Number);
            const bStart = bStartHour * 60 + bStartMinute;
            const bEnd = bStart + slot.service_time;

            
            // console.log("Comparing booking:", {
            //     requestedTime: `${start_time} (${bookingStart}-${bookingEnd} minutes)`,
            //     existingTime: `${slot.start_time} (${bStart}-${bEnd} minutes)`,
            //     bookingServiceTime: slot.service_time
            // }, slot);
            
            if (Math.max(bookingStart, bStart) < Math.min(bookingEnd, bEnd)) {
                // console.log("⛔ Time slot conflict detected! Another booking exists at this time");
                return {available: false, reason: "Time slot already booked"};
            }
        }
    }

    return {available: true}; // No overlaps, slot is available

}

/**
 * Validate booking date (only today and next 2 days)
 * @param {Date} date - Date to validate
 * @returns {boolean} Whether the date is valid for booking
 */
export const isValidBookingDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 2);
    
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    // console.log("bookingDate validation", bookingDate, today, maxDate);
    
    return bookingDate >= today && bookingDate <= maxDate;
};