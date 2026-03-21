import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    customerdetails: {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Customer ID is required"],
        },
        customer_name: {
            type: String,
            required: [true, "Customer name is required"],
        },
        customer_phone: {
            type: String,
            required: [true, "Customer phone number is required"],
        },
        customer_email: {
            type: String,
        },
        customer_profileUrl: {
            type: String,
        }

    },
    serviceProviders: [
        {
            barber_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: [true, "Barber ID is required"],
            },
            services: {
                type: [String],
                required: [true, "At least one service is required"],
            },
            service_time: {
                type: Number, // total in minutes (sum of selected services)
                required: [true, "Service time is required"],
            },
            start_time: {
                type: String, // Format: "HH:MM" (24-hour format)
                validate: {
                    validator: function (v) {
                        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                    },
                    message: "Invalid time format. Use HH:MM"
                }
            },
            end_time: {
                type: String, // Format: "HH:MM" (24-hour format)
            },
            booking_slots: [{
                type: String,
            }],
        }
    ],
    date: {
        type: Date,
        required: [true, "Date is required"],

    },
    status: {
        type: String,
        enum: ["booked", "arrived", "completed", "cancelled"],
        default: "pending",
    },
    payment: {
        type: String,
        default: "pending",
    },

    isOffline: {
        type: Boolean,
        default: true,
    },
    total_amount_paid: {
        type: Number,
        default: 0,
    },
    discount_applied: {
        type: Number,
        default: 0,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    }
});

// Pre-save middleware to calculate end_time and booking_slots
BookingSchema.pre('save', function (next) {
    // Handle serviceProviders array
    if (this.serviceProviders && this.serviceProviders.length > 0) {
        this.serviceProviders.forEach(provider => {
            if (provider.start_time && provider.service_time) {
                // Calculate end time for this provider
                const [hours, minutes] = provider.start_time.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + provider.service_time;

                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                provider.end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

                // Generate 5-minute slots for this provider
                provider.booking_slots = [];
                for (let i = startMinutes; i < endMinutes; i += 5) {
                    const slotHours = Math.floor(i / 60);
                    const slotMins = i % 60;
                    provider.booking_slots.push(`${String(slotHours).padStart(2, '0')}:${String(slotMins).padStart(2, '0')}`);
                }
            }
        });
    }

    this.updated_at = Date.now();
    next();
});



export default mongoose.model("Booking", BookingSchema);