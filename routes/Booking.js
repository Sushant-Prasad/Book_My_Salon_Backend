import express from "express";
import {
    createBooking,
    getCustomerBookings,
    getBarberBookings,
    cancelBooking,
    bookedSlotes,
    updateBookingStatus,
    makeSlotAvialable,
    getBarberBookingsWithDate,
    updateBooking,
    createAndUpdateOfflineBooking
} from "../controllers/Booking.js";
import isAuthenticated, { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all booked timeslots for customers
router.get("/customer/booked-timeslots", bookedSlotes);

// Get available time slots (accessible to all authenticated users)

// Create a new booking (only customers)
router.post("/create", isAuthenticated, createBooking);

// Create offline booking (only admin)
router.put("/create-offline", isAuthenticated, isAdmin, createAndUpdateOfflineBooking);

// Get customer's bookings
router.get("/customer/my-bookings", isAuthenticated, getCustomerBookings);

// Get barber's bookings
router.get("/barber/all-bookings", isAuthenticated, getBarberBookings);

// Get barber's bookings with date filter
router.get("/barber/date-bookings", isAuthenticated, getBarberBookingsWithDate);

// Update booking (by admin)
router.put("/update/:bookingId", isAuthenticated, isAdmin,  updateBooking);

// Update booking status (barber or customer)
router.patch("/status/:bookingId", isAuthenticated, updateBookingStatus);

// Make avialable current slot booking (for barber)
router.patch("/slot-free/:bookingId", isAuthenticated, makeSlotAvialable);

// Cancel booking (only customer)
router.put("/cancel/:bookingId", isAuthenticated, cancelBooking);

export default router;