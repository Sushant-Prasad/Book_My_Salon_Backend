import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [4, "Name should have more than 4 characters"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
    },
    DOB: {
        type: Date,
        default: null,
    },
    phone: {
        type: String,
        default: null,
    },
    profileUrl: {
        type: String,
        default: null,
    },
    gender:{
        type: String,
        default: null,
    },
    role: {
        type: String,
        default: "customer",
    },
    spam: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    
});

export default mongoose.model("User", UserSchema);