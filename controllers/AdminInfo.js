import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import AdminInfo from "../models/AdminInfo.js";
import ErrorHandler from "../utils/errorhandler.js";

export const getAdminInfo = catchAsyncErrors(async (req, res, next) => {

    const adminInfo =  await AdminInfo.findOne();

    if (!adminInfo) {
        return next(new ErrorHandler("Admin info not found", 404));
    }
    res.status(200).json({
        success: true,
        data: adminInfo
    });
});

export const setAdminInfo = catchAsyncErrors(async (req, res, next) => {
    const { shop_name, shop_address, shop_phone, shop_email, offlineDays, notice } = req.body;
    
    // Use findOneAndUpdate with upsert for better performance
    const adminInfo = await AdminInfo.findOneAndUpdate(
        {}, // Empty filter to find any document
        {
            shop_name,
            shop_address,
            shop_phone,
            shop_email,
            offlineDays,
            notice
        },
        { 
            new: true, 
            upsert: true, // Create if doesn't exist
            runValidators: true 
        }
    );

    res.status(200).json({
        success: true,
        message: "Admin info set/updated successfully",
        data: adminInfo
    });
});