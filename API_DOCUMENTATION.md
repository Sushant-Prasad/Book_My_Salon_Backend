# Barber Slot Booking System - Backend API

## Models Created

### 1. Booking Model
- Auto-generated booking ID
- Customer and Barber references
- Service details with duration
- Date and time management
- 15-minute slot tracking
- Status management (pending, confirmed, completed, cancelled)

### 2. ShopDetails Model
- Barber shop information
- Operating hours and closing days
- Tiffin time management
- Service offerings with pricing
- Slot interval configuration (15/30 minutes)
- Advance booking settings

### 3. SpamList Model
- Customer blocking by barbers
- Reason tracking
- Temporary vs permanent blocks
- Unblock date management

### 4. BookingHistory Model
- Comprehensive booking history
- Customer and barber relationship tracking
- Service completion records
- Rating and review system

## Time Slot Management System

### Key Features:
1. **15-minute intervals** - All time slots are managed in 15-minute intervals
2. **Overlap prevention** - Booking slots array prevents overlapping bookings
3. **Dynamic availability** - Real-time slot availability checking
4. **Service duration aware** - Automatically calculates required consecutive slots

### How It Works:

#### Frontend Implementation Suggestion:
```javascript
// Example API call to get available slots
const getAvailableSlots = async (barberId, date, serviceDuration) => {
  const response = await fetch(`/api/v1/booking/available-slots?barberId=${barberId}&date=${date}&serviceDuration=${serviceDuration}`);
  const data = await response.json();
  return data.available_slots;
};

// Display slots with disabled state
const renderTimeSlots = (availableSlots, bookedSlots) => {
  const allSlots = generateAllSlots(); // Generate 15-min intervals
  
  return allSlots.map(slot => ({
    time: slot,
    disabled: !availableSlots.some(available => available.start_time === slot),
    available: !bookedSlots.includes(slot)
  }));
};
```

## API Endpoints

### Booking Routes (`/api/v1/booking`)
- `GET /available-slots` - Get available time slots
- `POST /create` - Create new booking
- `GET /customer/my-bookings` - Get customer's bookings
- `GET /barber/my-bookings` - Get barber's bookings
- `PUT /update-status/:bookingId` - Update booking status
- `PUT /cancel/:bookingId` - Cancel booking

### Shop Details Routes (`/api/v1/shop`)
- `GET /all-barbers` - Get all barbers (public)
- `GET /details/:barberId` - Get shop details (public)
- `POST /create-update` - Create/update shop details
- `GET /my-details` - Get own shop details
- `PUT /toggle-today-open` - Toggle shop open/closed
- `POST /spam-list/add` - Add customer to spam list
- `GET /spam-list` - Get spam list
- `DELETE /spam-list/remove/:customer_id` - Remove from spam list
- `GET /customer-history` - Get customer history

## Optimizations Implemented

### 1. Database Indexing
```javascript
// Efficient querying for bookings
BookingSchema.index({ barber_id: 1, date: 1, status: 1 });
BookingSchema.index({ customer_id: 1, date: 1 });

// Spam list prevention
SpamListSchema.index({ barber_id: 1, customer_id: 1 }, { unique: true });
```

### 2. Time Slot Algorithm
- Pre-calculates all required slots for a booking
- Checks consecutive slot availability
- Prevents double booking efficiently

### 3. Booking Restrictions
- **2-day advance booking limit** - Configurable per barber
- **2-hour cancellation policy** - Prevents last-minute cancellations
- **Spam list checking** - Automatic blocking of problematic customers

## Frontend Integration Suggestions

### 1. Time Slot Display (15-minute intervals)
```javascript
// Generate time slots from 9:00 AM to 8:00 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

// Check slot availability
const isSlotAvailable = (slot, availableSlots, serviceDuration) => {
  return availableSlots.some(available => 
    available.start_time === slot && 
    available.duration >= serviceDuration
  );
};
```

### 2. Booking Flow
1. Customer selects barber
2. Customer picks service (gets duration automatically)
3. Customer selects date (today + next 2 days)
4. System shows available slots based on service duration
5. Customer selects slot and confirms booking

### 3. Real-time Updates
```javascript
// Recommended: Use Socket.io for real-time slot updates
socket.on('booking_created', (data) => {
  // Refresh available slots
  updateSlotAvailability(data.barber_id, data.date);
});
```

## Environment Variables Needed
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/barber_booking
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

## Usage Examples

### 1. Create Shop Details
```javascript
POST /api/v1/shop/create-update
{
  "shop_name": "Elite Barber Shop",
  "shop_address": "123 Main Street",
  "phone": "9876543210",
  "opening_hours": {
    "start": "09:00",
    "end": "20:00"
  },
  "tiffin_time": {
    "start": "13:00",
    "end": "14:00"
  },
  "services": [
    {
      "name": "Hair Cutting",
      "duration": 45,
      "price": 200,
      "available": true
    },
    {
      "name": "Shaving",
      "duration": 30,
      "price": 100,
      "available": true
    }
  ],
  "closing_days": ["Sunday"],
  "slot_interval": 15
}
```

### 2. Create Booking
```javascript
POST /api/v1/booking/create
{
  "barber_id": "6547d1e123456789abcdef12",
  "service": "Hair Cutting",
  "date": "2025-11-09",
  "start_time": "10:00"
}
```

### 3. Get Available Slots
```javascript
GET /api/v1/booking/available-slots?barberId=6547d1e123456789abcdef12&date=2025-11-09&serviceDuration=45

Response:
{
  "success": true,
  "data": {
    "available_slots": [
      {
        "start_time": "09:00",
        "end_time": "09:45",
        "duration": 45,
        "slots_covered": ["09:00", "09:15", "09:30"]
      },
      {
        "start_time": "10:30",
        "end_time": "11:15",
        "duration": 45,
        "slots_covered": ["10:30", "10:45", "11:00"]
      }
    ]
  }
}
```

## Security Features
1. **JWT Authentication** - All protected routes require valid tokens
2. **Role-based Access** - Different permissions for customers and barbers
3. **Spam Protection** - Barbers can block problematic customers
4. **Input Validation** - All inputs are validated and sanitized
5. **Rate Limiting** - Prevents abuse of booking system

## Performance Optimizations
1. **Database Indexes** - Optimized for common query patterns
2. **Pagination** - All list endpoints support pagination
3. **Selective Population** - Only necessary fields are populated
4. **Caching Ready** - Structure supports Redis caching
5. **Aggregation Pipelines** - Efficient data aggregation for analytics

This system provides a robust foundation for your barber booking application with efficient time slot management and comprehensive booking features.