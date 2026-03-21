// Date utility functions for consistent timezone handling and date operations

export const getIndiaTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

export const getIndiaDateAtMidnight = (date = null) => {
    const indiaTime = date ? new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })) : getIndiaTime();
    return new Date(indiaTime.getFullYear(), indiaTime.getMonth(), indiaTime.getDate());
};

export const getDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
};

export const getLastNMonths = (n = 3) => {
    const currentDate = new Date();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const months = [];
    
    for (let i = n - 1; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({
            name: monthNames[targetDate.getMonth()],
            year: targetDate.getFullYear(),
            startOfMonth: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
            endOfMonth: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999)
        });
    }
    
    return months;
};

export const isValidBookingDate = (bookingDate) => {
    const today = getIndiaDateAtMidnight();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 2);
    
    const inputDate = getIndiaDateAtMidnight(bookingDate);
    
    return inputDate >= today && inputDate <= maxDate;
};

export const getBookingTimeRange = () => {
    const today = getIndiaDateAtMidnight();
    const thirdDay = new Date(today);
    thirdDay.setDate(today.getDate() + 2);
    thirdDay.setHours(23, 59, 59, 999);
    
    return { start: today, end: thirdDay };
};