import mongoose from "mongoose";

const SpamListSchema = new mongoose.Schema({
    barber_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Barber ID is required"],
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer ID is required"],
    },
    customer_name: {
        type: String,
        required: [true, "Customer name is required"],
    },
    customer_email: {
        type: String,
        required: [true, "Customer email is required"],
    },
    customer_phone: {
        type: String,
        required: [true, "Customer phone is required"],
    },
    reason: {
        type: String,
        
    },
    blocked_date: {
        type: Date,
        default: Date.now,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});



export default mongoose.model("SpamList", SpamListSchema);