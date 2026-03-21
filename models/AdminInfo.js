import mongoose from "mongoose";

const AdminInfoSchema = new mongoose.Schema({
    shop_name: {
        type: String,
        required: [true, "Shop name is required"],
        trim: true,
    },
    shop_address: {
        type: String,
        required: [true, "Shop address is required"],
        trim: true,
    },
    shop_phone: {
        type: String,
        required: [true, "Shop phone number is required"],
        trim: true,
    },
    shop_email: {
        type: String,
        required: [true, "Shop email is required"],
        trim: true,
    },
    offlineDays: {
        type: [String], // e.g., ["Sunday", "Saturday"]
        default: [],
    },
    notice: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

export default mongoose.model("AdminSetInfo", AdminInfoSchema);