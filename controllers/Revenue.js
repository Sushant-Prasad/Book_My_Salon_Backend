import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import Booking from "../models/Booking.js";
import { getLastNMonths } from "../utils/dateUtils.js";
import { getRevenueAggregation } from "../utils/dbUtils.js";

export const getLastThreeMonthRevenue = catchAsyncErrors(async (req, res) => {
    const monthsData = getLastNMonths(3);
    
    // Parallel execution for all months
    const revenuePromises = monthsData.map(async (monthInfo) => {
        const aggregation = getRevenueAggregation(monthInfo.startOfMonth, monthInfo.endOfMonth);
        const monthlyRevenue = await Booking.aggregate(aggregation);
        return monthlyRevenue.length > 0 ? monthlyRevenue[0].totalRevenue : 0;
    });
    
    const revenues = await Promise.all(revenuePromises);
    const months = monthsData.map(m => m.name);

    res.status(200).json({  
        success: true,
        data: {
            months: months,
            revenue: revenues
        }
    });
});

export const getBarberRevenueByMonth = catchAsyncErrors(async (req, res) => {
    const monthsData = getLastNMonths(3);
    
    // Parallel execution for all months
    const monthlyDataPromises = monthsData.map(async (monthInfo) => {
        const aggregation = getRevenueAggregation(monthInfo.startOfMonth, monthInfo.endOfMonth, "$serviceProviders.barber_id");
        const monthlyBarberRevenue = await Booking.aggregate(aggregation);
        
        return {
            month: monthInfo.name,
            year: monthInfo.year,
            barbers: monthlyBarberRevenue
        };
    });
    
    const monthlyData = await Promise.all(monthlyDataPromises);
    // console.log(monthlyData);

    res.status(200).json({  
        success: true,
        data: monthlyData
    });
});



