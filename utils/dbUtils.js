// Database utility functions for common aggregation and query operations

export const getRevenueAggregation = (startDate, endDate, groupBy = null) => {
    const matchStage = {
        $match: {
            date: { $gte: startDate, $lte: endDate },
            status: "completed",
            payment: "paid"
        }
    };

    let pipeline = [matchStage];
    
    if (groupBy === "$serviceProviders.barber_id") {
        // First, calculate total service time for each booking before unwinding
        pipeline.push(
            {
                $addFields: {
                    totalServiceTime: {
                        $sum: "$serviceProviders.service_time"
                    }
                }
            },
            // Unwind serviceProviders array to get individual barber entries
            {
                $unwind: {
                    path: "$serviceProviders",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $addFields: {
                    // Calculate proportional revenue for this barber
                    barberRevenue: {
                        $cond: {
                            if: { $gt: ["$totalServiceTime", 0] },
                            then: {
                                $multiply: [
                                    "$total_amount_paid",
                                    { $divide: ["$serviceProviders.service_time", "$totalServiceTime"] }
                                ]
                            },
                            else: "$total_amount_paid"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$serviceProviders.barber_id",
                    totalRevenue: { $sum: "$barberRevenue" },
                    totalBookings: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "barberInfo"
                }
            },
            {
                $unwind: {
                    path: "$barberInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    barberId: "$_id",
                    barberName: { $ifNull: ["$barberInfo.name", "Unknown Barber"] },
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    totalBookings: 1
                }
            },
            { $sort: { totalRevenue: -1 } }
        );
    } else {
        // For total revenue (no grouping by barber)
        pipeline.push({
            $group: {
                _id: groupBy,
                totalRevenue: { $sum: "$total_amount_paid" },
                totalBookings: { $sum: 1 }
            }
        });
    }

    return pipeline;
};

export const getPaginationOptions = (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return {
        skip,
        limit: parseInt(limit),
        page: parseInt(page)
    };
};

export const formatPaginationResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
        }
    };
};