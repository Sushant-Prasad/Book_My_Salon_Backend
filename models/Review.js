import mongoose from "mongoose";
const schema = new mongoose.Schema({
    comment: {
        type: String,
        maxlength: [300, "Comment must not be more than 300 characters"],
    },
    rating: {
        type: Number,
        required: [true, "Please give Rating"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must not be more than 5"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    barber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });
export const Review = mongoose.model("Review", schema);