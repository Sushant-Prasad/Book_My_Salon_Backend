// Get closing time based on day type
export const getClosingTime = (dayIndex) => {
    const shopDetail = shopDetails && shopDetails[0]
    if (!shopDetail) return 21 // Default closing time
    
    const selectedDate = new Date(Object.values(dates)[dayIndex])
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Check if it's half closing day
    if (shopDetail.half_closing_day === dayName) {
      return 14 // Half day closes at 2 PM
    }
    
    return 21 // Normal closing time
  }