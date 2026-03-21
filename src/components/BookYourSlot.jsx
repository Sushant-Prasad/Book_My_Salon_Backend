import React, { useState, useEffect } from 'react'
import right from '../assets/next.png'
import left from '../assets/left.png'
import { RefreshCw } from 'lucide-react'
import {
  BarberSkeleton,
  DateNavigationSkeleton,
  TimeSlotsectionSkeleton,
} from './Skeleton'
import CustomerBookings from './CustomerBookings'
import MultiBarberBookingModal from './MultiBarberBookingModal'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import {
  useGetBookedSlotsQuery,
  useGetBarberDateBookingsQuery,
  useCreateBookingMutation
} from '../redux/api/api'

const BookYourSlot = ({ path, shopInfo, userRole, refechBooking }) => {
  const { user } = useSelector((state) => state.auth);
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedBarber, setSelectedBarber] = useState(0);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [slotInterval, setSlotInterval] = useState(15);
  const [page, setPage] = useState(1);
  const [barberId, setBarberId] = useState(null);
  const [date, setDate] = useState('');

  // Multi-barber booking state
  const [multiBarberBookings, setMultiBarberBookings] = useState([]);
  const [showBarberSelection, setShowBarberSelection] = useState(false);
  const [currentBookingBarber, setCurrentBookingBarber] = useState(null);
  const [currentBookingSlot, setCurrentBookingSlot] = useState(null);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  // Redux hooks
  const { data: bookedSlotsData, isLoading: slotsLoading, refetch: refetchSlots } = useGetBookedSlotsQuery();
  const { data: barberBookingsData, refetch: refetchBarberBookings } = useGetBarberDateBookingsQuery(
    { barberId, date, page, limit: 10 },
    { skip: !barberId || !date }
  );
  // console.log("Booked Slots Data:", bookedSlotsData);
  // console.log("Barber Bookings Data:", barberBookingsData);
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();

  // Extract data from Redux responses
  const BookedSlots = bookedSlotsData?.data || null;
  const shopDetails = bookedSlotsData?.shopDetails || null;
  const customerBookingsData = barberBookingsData?.data || [];
  const loading = slotsLoading;


  // Add CSS animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
          }
          }
          `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set selected barber to current user if user is a barber
  useEffect(() => {
    if (user && user.role === 'barber' && BookedSlots && BookedSlots.length > 0) {
      const barberIndex = BookedSlots.findIndex(barber => barber._id === user._id);
      if (barberIndex !== -1) {
        setSelectedBarber(barberIndex);
        setBarberId(user._id);
        // Set slot interval for the barber
        const barberShopDetails = shopDetails?.find(shop => shop.barber_id === user._id);
        if (barberShopDetails) {
          setSlotInterval(barberShopDetails.slot_interval || 15);
        }
      }
    }
  }, [user, BookedSlots, shopDetails]);

  // Generate time slots based on shop opening hours
  const generateTimeSlots = () => {
    const slots = []
    
    // Get shop details for selected barber
    const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null))
    
    if (!shopDetail || !shopDetail.opening_hours) {
      // Fallback to default hours if no shop details
      for (let hour = 10; hour < 21; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval || 15) {
          const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          slots.push(timeString)
        }
      }
      return slots
    }
    
    // Parse opening hours
    const startTime = shopDetail.opening_hours.start // e.g., "09:00"
    const endTime = shopDetail.opening_hours.end     // e.g., "20:00"
    
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    // Convert to minutes for easier calculation
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    // Generate slots based on shop's slot interval
    const interval = shopDetail.slot_interval || 15
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      slots.push(timeString)
    }

    return slots
  }

  // Convert 24-hour format to 12-hour AM/PM format
  const formatTimeToAMPM = (time24) => {
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }

  const allTimeSlots = generateTimeSlots()

  // Get current date and next days in India timezone
  const getCurrentDate = () => {
    const now = new Date()
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))

    const today = indiaTime
    const nextDay = new Date(today)
    nextDay.setDate(today.getDate() + 1)
    const nextSecondDay = new Date(today)
    nextSecondDay.setDate(today.getDate() + 2)

    const formatDateString = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      today: formatDateString(today),
      nextDay: formatDateString(nextDay),
      nextSecondDay: formatDateString(nextSecondDay)
    }
  }

  const dates = getCurrentDate()

  // Initialize date when component mounts
  useEffect(() => {
    if (!date) {
      setDate(Object.values(dates)[currentDay]);
    }
  }, []);

  // Get booked slots for current day
  const getBookedSlots = () => {
    if (!BookedSlots || !BookedSlots[selectedBarber]) return []
    const dayKeys = ['today', 'next_day', 'next_second_day'];

    return BookedSlots[selectedBarber][dayKeys[currentDay]] || []
  }

  // Check if slot is disabled (booked, tiffin time, shop closed, past time, closing days)
  const isSlotDisabled = (timeSlot) => {
    const bookedSlots = getBookedSlots()

    // Check if slot is booked
    if (bookedSlots.includes(timeSlot)) return true

    // Get current date and time in India timezone
    const now = new Date()
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const currentHour = indiaTime.getHours()
    const currentMinute = indiaTime.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Parse slot time
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)
    const slotTimeInMinutes = slotHour * 60 + slotMinute

    // For today's slots, check if time has passed
    if (currentDay === 0) {
      if (slotTimeInMinutes <= currentTimeInMinutes) return true
    }

    // Get shop details for selected barber
    const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null))
    if (!shopDetail) return true

    // Check if shop is closed today (only for current day - currentDay === 0)
    if (currentDay === 0 && !shopDetail.today_open) return true

    // Get the day name for the selected date
    const selectedDate = new Date(Object.values(dates)[currentDay])
    const dayName = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })

    // Check if it's a full closing day
    if (shopDetail.closing_days && shopDetail.closing_days.includes(dayName)) return true

    // Check half closing day (shop closes early)
    if (shopDetail.half_closing_day === dayName && slotHour >= 14) return true

    // Check if slot is outside shop opening hours
    if (shopDetail.opening_hours) {
      const [openHour, openMinute] = shopDetail.opening_hours.start.split(':').map(Number)
      const [closeHour, closeMinute] = shopDetail.opening_hours.end.split(':').map(Number)
      
      const openTimeInMinutes = openHour * 60 + openMinute
      const closeTimeInMinutes = closeHour * 60 + closeMinute
      
      if (slotTimeInMinutes < openTimeInMinutes || slotTimeInMinutes >= closeTimeInMinutes) {
        return true
      }
    }

    // Check tiffin time
    if (shopDetail.tiffin_time && shopDetail.tiffin_time.start && shopDetail.tiffin_time.end && !(shopDetail.half_closing_day === dayName)) {
      const [tiffinStartHour, tiffinStartMinute] = shopDetail.tiffin_time.start.split(':').map(Number)
      const [tiffinEndHour, tiffinEndMinute] = shopDetail.tiffin_time.end.split(':').map(Number)
      
      const tiffinStartMinutes = tiffinStartHour * 60 + tiffinStartMinute
      const tiffinEndMinutes = tiffinEndHour * 60 + tiffinEndMinute
      
      if (slotTimeInMinutes >= tiffinStartMinutes && slotTimeInMinutes < tiffinEndMinutes) {
        return true
      }
    }

    return false
  }

  // Check if slot is booked (for styling)
  const isSlotBooked = (timeSlot) => {
    const bookedSlots = getBookedSlots()
    return bookedSlots.includes(timeSlot)
  }

  // Handle day navigation
  const handlePreviousDay = () => {
    setCurrentDay(prev => Math.max(0, prev - 1))
  }
  // Handle day navigation
  const handleNextDay = () => {
    setCurrentDay(prev => Math.min(2, prev + 1))
  }

  // Handle slot selection
  const handleSlotClick = (timeSlot) => {
    if (isSlotDisabled(timeSlot)) return

    setSelectedSlot(timeSlot)
    setCurrentBookingBarber(BookedSlots[selectedBarber]._id)
    setCurrentBookingSlot(timeSlot)
    setShowServiceModal(true)
  }

  // Handle service selection
  const toggleService = (serviceName) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceName)) {
        return prev.filter(s => s !== serviceName)
      } else {
        return [...prev, serviceName]
      }
    })
  }

  // Handle adding more barbers
  const handleAddMoreBarbers = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    // Calculate service time
    const shopDetail = shopDetails.find(shop => shop.barber_id === currentBookingBarber);
    let totalServiceTime = 0;
    selectedServices.forEach(serviceName => {
      const service = shopDetail?.services.find(s => s.name.trim() === serviceName.trim());
      if (service) totalServiceTime += service.duration;
    });

    // Add to multi-barber bookings
    const newBooking = {
      barber_id: currentBookingBarber,
      barber_name: BookedSlots[selectedBarber]?.name || '',
      barber_photo: BookedSlots[selectedBarber]?.photoUrl || '',
      services: [...selectedServices],
      service_time: totalServiceTime,
      start_time: currentBookingSlot
    };

    setMultiBarberBookings(prev => [...prev, newBooking]);
    setSelectedServices([]);
    setShowServiceModal(false);
    setShowBarberSelection(true);
  };

  // Handle removing a barber from multi-booking
  const handleRemoveBarberBooking = (index) => {
    setMultiBarberBookings(prev => prev.filter((_, i) => i !== index));
  };

  // Handle canceling multi-barber selection
  const handleCancelMultiBooking = () => {
    setShowBarberSelection(false);
    setMultiBarberBookings([]);
    setSelectedServices([]);
    setCurrentBookingBarber(null);
    setCurrentBookingSlot(null);
  };

  // Handle selecting a new barber from barber selection view
  const handleSelectBarberSlot = (barberIndex, timeSlot) => {
    // Check if slot is available for this barber
    const prevSelectedBarber = selectedBarber;
    setSelectedBarber(barberIndex);
    
    // Check if the slot is disabled for this barber
    const bookedSlots = BookedSlots[barberIndex] ? 
      (BookedSlots[barberIndex][['today', 'next_day', 'next_second_day'][currentDay]] || []) : [];
    
    if (bookedSlots.includes(timeSlot)) {
      toast.error('This time slot is already booked for this barber');
      setSelectedBarber(prevSelectedBarber);
      return;
    }

    setCurrentBookingBarber(BookedSlots[barberIndex]._id);
    setCurrentBookingSlot(timeSlot);
    setShowBarberSelection(false);
    setShowServiceModal(true);
  };

  // Handle booking (single or multiple barbers)
  const handleBookNow = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    // Calculate service time for current selection
    const shopDetail = shopDetails.find(shop => shop.barber_id === currentBookingBarber);
    let totalServiceTime = 0;
    selectedServices.forEach(serviceName => {
      const service = shopDetail?.services.find(s => s.name.trim() === serviceName.trim());
      if (service) totalServiceTime += service.duration;
    });
    // Add current selection to bookings if in multi-booking mode
    const currentBooking = {
      barber_id: currentBookingBarber,
      services: selectedServices.map(service => service.trim()),
      service_time: totalServiceTime,
      start_time: currentBookingSlot
    };
    const allBookings = multiBarberBookings.length > 0 
      ? [...multiBarberBookings.map(b => ({
          barber_id: b.barber_id,
          services: b.services.map(s => s.trim()),
          service_time: b.service_time,
          start_time: b.start_time
        })), currentBooking]
      : [currentBooking];

    const bookingData = {
      serviceProviders: allBookings,
      date: Object.values(dates)[currentDay]
    };
    // console.log("Final Booking Data:", bookingData);

    try {
      const result = await createBooking(bookingData).unwrap();
      toast.success(result.message);

      // Refresh booked slots after successful booking
      refetchSlots();
      if (barberId && date) {
        refetchBarberBookings();
      }
    } catch (error) {
      console.error("Booking error:", error); 
      toast.error(error.data?.message || error.message || "Booking failed");
    }

    // Reset all states
    setShowServiceModal(false);
    setShowBarberSelection(false);
    setSelectedServices([]);
    setSelectedSlot(null);
    setMultiBarberBookings([]);
    setCurrentBookingBarber(null);
    setCurrentBookingSlot(null);
    
    // Refetch bookings in Home page
    if (refechBooking) {
      refechBooking();
    }
  }

  // Get closing time based on day type and shop opening hours
  const getClosingTime = (dayIndex, barberInd) => {
    const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[barberInd] ? BookedSlots[barberInd]._id : null))
    if (!shopDetail || !shopDetail.opening_hours) return 21

    const selectedDate = new Date(Object.values(dates)[dayIndex])
    const dayName = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })

    // If it's a half closing day, return 14 (2 PM)
    if (shopDetail.half_closing_day === dayName) {
      return 14
    }
    
    // Parse the end time from opening hours
    const [endHour] = shopDetail.opening_hours.end.split(':').map(Number)
    return endHour
  }

  // Check if entire day is closed
  const isDayClosed = (dayIndex, barberInd) => {
    const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[barberInd] ? BookedSlots[barberInd]._id : null))
    if (!shopDetail) return false

    // Check today_open only for today (dayIndex === 0)
    if (dayIndex === 0 && !shopDetail.today_open) return true

    const selectedDate = new Date(Object.values(dates)[dayIndex])
    const dayName = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })

    return shopDetail.closing_days && shopDetail.closing_days.includes(dayName)
  }

  const getDayNames = () => {
    const now = new Date()
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const days = []

    for (let i = 0; i < 3; i++) {
      const date = new Date(indiaTime)
      date.setDate(indiaTime.getDate() + i)

      const dayName = date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })
      const monthName = date.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })
      const dayNumber = date.getDate()

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const fullDate = `${year}-${month}-${day}`

      days.push(`${dayName}, ${monthName} ${dayNumber} • ${fullDate}`)
    }
    return days
  }

  // Set initial barberId when BookedSlots is loaded
  useEffect(() => {
    if (BookedSlots && BookedSlots.length > 0 && !barberId) {
      const initialBarber = BookedSlots[selectedBarber]._id;
      setBarberId(initialBarber);
      const initialDate = Object.values(dates)[currentDay];
      setDate(initialDate);
    }
  }, [BookedSlots]);

  // Call refetch when date changes (currentDay navigation)
  useEffect(() => {
    if (BookedSlots && BookedSlots.length > 0 && barberId) {
      const newDate = Object.values(dates)[currentDay];
      setDate(newDate);
    }
  }, [currentDay, BookedSlots]);


  const handleChange = async (newDate) => {
    setDate(newDate);
  }
  
  // Function to refresh customer bookings data
  const refreshCustomerBookings = async () => {
    if (barberId && date) {
      refetchBarberBookings();
    }
  };
  
  // Handle page change for pagination
  const handlePageChange = async (newPage) => {
    setPage(newPage);
  };

  const selectedDay = getDayNames()[currentDay].slice(0, 3)
  const offlineDay = shopInfo && shopInfo.offlineDays && shopInfo.offlineDays.includes(selectedDay);

  return (
    <>
      <div className='flex flex-col-reverse md:flex-row lg:flex-row'>

        {user && user.role === 'admin' && path === '/admin/dashboard' && (
          <div className='w-full lg:w-[60vw] mb-6'>
            <div className='flex justify-between mb-6'>
              <h2 className="text-xl font-semibold text-gray-800 mt-4 ml-4 mb-4 sm:mb-0">Customer Bookings</h2>
              <div className='flex justify-center items-center mt-4 mr-4 gap-2 '>
                <button
                  onClick={() => {
                    refetchSlots();
                    if (barberId && date) {
                      refetchBarberBookings();
                    }
                    toast.success('Data refreshed!');
                  }}
                  className='bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors duration-200'
                  title='Refresh bookings'
                >
                  <RefreshCw className='w-5 h-5' />
                </button>
                <input type="date"
                  value={date}
                  onChange={(e) => { handleChange(e.target.value) }}
                  className='w-full bg-[#D4DAFF]  px-2 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer outline-none transition-all'
                />
              </div>
            </div>

            {/* customer bookings component */}
            <div className='space-y-4 w-[95%] mx-auto'>
              <CustomerBookings 
                bookingsData={customerBookingsData}
                onRefreshData={refreshCustomerBookings}
                availableBarbers={BookedSlots || []}
                onPageChange={handlePageChange}
                currentPage={page}
                shopDetails={shopDetails || []}
              />
            </div>
          </div>

        )}
        <div className={user && user.role === 'admin' && path === '/admin/dashboard' ? 'w-full lg:w-[30vw]' : 'w-full'}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Book Your Slot</h2>
          <div className='flex flex-col justify-center items-center'>
            {/* Barber Selection */}
            <div className="w-full flex justify-center items-center max-w-md mb-4">
              <div className={`flex gap-4 justify-start px-4 ${BookedSlots && BookedSlots.length > 5 ? 'overflow-x-auto pb-2' : 'justify-center'}`}>
                {loading ? (
                  <>
                    <BarberSkeleton />
                    <BarberSkeleton />
                  </>
                ) : (
                  BookedSlots && BookedSlots.map((barber, index) => (
                    <div
                      key={barber._id}
                      className={`flex flex-col w-[48px] gap-2 cursor-pointer ${selectedBarber === index ? 'opacity-100' : 'opacity-50'}`}
                      onClick={() => {
                        for (let i = 0; i < shopDetails.length; i++) {
                          if (barber._id === shopDetails[i].barber_id) {
                            setSlotInterval(shopDetails && shopDetails[i].slot_interval)
                          } else {
                            setSlotInterval(15)
                          }
                        }
                        setBarberId(barber._id);
                        return setSelectedBarber(index)
                      }}
                    >
                      <img
                        src={barber.photoUrl}
                        alt={barber.name}
                        loading="lazy"
                        className={`rounded-full border-2 w-12 h-12 ${selectedBarber === index ? 'border-indigo-600' : 'border-indigo-400'}`}
                      />
                      <div className={`h-1 rounded ${selectedBarber === index ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                      <p className="text-xs text-center font-medium ">{barber.name}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className='bg-[#A89FFB] flex flex-col items-center rounded-2xl p-2 mt-4 relative overflow-hidden'>
              {loading ? (
                <>
                  <DateNavigationSkeleton />
                  <TimeSlotsectionSkeleton />
                </>
              ) : (
                <>
                  {/* Date Navigation */}
                  <div className='flex gap-2 w-full justify-between items-center mb-4'>
                    <button
                      onClick={handlePreviousDay}
                      disabled={currentDay === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-full ${currentDay === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#dac9fd] hover:bg-opacity-20'}`}
                    >
                      <img src={left} alt="Previous" loading="lazy" className='w-6' />
                    </button>

                    <div className="text-md text-gray-700 bg-[#dac9fd] rounded-full px-4 py-2 font-medium">
                      {getDayNames()[currentDay]}
                    </div>

                    <button
                      onClick={handleNextDay}
                      disabled={currentDay === 2}
                      className={`w-10 h-10 flex items-center justify-center rounded-full ${currentDay === 2 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#dac9fd] hover:bg-opacity-20'}`}
                    >
                      <img src={right} alt="Next" loading="lazy" className='w-6' />
                    </button>
                  </div>
                </>
              )}

              {/* Time Slots */}
              {!loading ? (
                isDayClosed(currentDay, selectedBarber) ? (
                  <div className="w-full text-center py-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                      <strong>Barber is not Available Today</strong>
                      {currentDay === 0 && shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null)) && !shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null)).today_open && (
                        <div className="text-sm mt-1">Today the shop is not open</div>
                      )}
                      {(() => {
                        const selectedDate = new Date(Object.values(dates)[currentDay])
                        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
                        const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null))
                        if (shopDetail && shopDetail.closing_days && shopDetail.closing_days.includes(dayName)) {
                          return <div className="text-sm mt-1">{dayName} is a closing day</div>
                        }
                        return null
                      })()}
                    </div>
                  </div>
                ) : offlineDay && path === '/' && userRole !== 'admin' && userRole !== 'barber'  ? (<>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                      <strong>This day Online booking is not available. Please visit shop for any services.</strong>
                      </div>
                </>) : (
                  <div
                    className='w-full transition-all duration-300 ease-in-out'
                    style={{
                      transform: `translateX(0)`,
                      animation: `slideIn 0.3s ease-in-out`
                    }}
                  >
                    {/* Dynamic Time Slots based on opening hours */}
                    {(() => {
                      const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null))
                      const openHour = shopDetail && shopDetail.opening_hours ? parseInt(shopDetail.opening_hours.start.split(':')[0]) : 10
                      const closeHour = getClosingTime(currentDay, selectedBarber)
                      
                      // Morning slots (opening time to 12:00)
                      const morningSlots = allTimeSlots.filter(slot => {
                        const hour = parseInt(slot.split(':')[0])
                        return hour >= openHour && hour < 12
                      })
                      
                      // Afternoon slots (12:00 to 17:00 or closing time if earlier)
                      const afternoonSlots = allTimeSlots.filter(slot => {
                        const hour = parseInt(slot.split(':')[0])
                        const maxHour = closeHour < 17 ? closeHour : 17
                        return hour >= 12 && hour < maxHour
                      })
                      
                      // Evening slots (17:00 to closing time)
                      const eveningSlots = closeHour > 17 ? allTimeSlots.filter(slot => {
                        const hour = parseInt(slot.split(':')[0])
                        return hour >= 17 && hour <= closeHour
                      }) : []
                      
                      return (
                        <>
                          {/* Morning Slots */}
                          {morningSlots.length > 0 && (
                            <div className='w-full mb-4'>
                              <h2 className='ml-2 text-[#0c1448] font-semibold mb-2'>
                                Morning ({shopDetail && shopDetail.opening_hours ? shopDetail.opening_hours.start : '10:00'} - 12:00)
                              </h2>
                              <div className='flex flex-wrap gap-2'>
                                {morningSlots.map((time) => {
                                  const disabled = isSlotDisabled(time)
                                  const booked = isSlotBooked(time)
                                  
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => handleSlotClick(time)}
                                      disabled={disabled}
                                      className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? booked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                                    >
                                      {formatTimeToAMPM(time)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Afternoon Slots */}
                          {afternoonSlots.length > 0 && (
                            <div className='w-full mb-4'>
                              <h2 className='ml-2 text-[#0c1448] font-semibold mb-2'>
                                Afternoon (12:00 - {closeHour < 17 ? `${String(closeHour).padStart(2, '0')}:00` : '05:00'})
                              </h2>
                              <div className='flex flex-wrap gap-2'>
                                {afternoonSlots.map((time) => {
                                  const disabled = isSlotDisabled(time)
                                  const booked = isSlotBooked(time)
                                  
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => handleSlotClick(time)}
                                      disabled={disabled}
                                      className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? booked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                                    >
                                      {formatTimeToAMPM(time)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Evening Slots - Only show if shop is open past 5 PM */}
                          {eveningSlots.length > 0 && (
                            <div className='w-full'>
                              <h2 className='ml-2 text-[#0c1448] font-semibold mb-2'>
                                Evening (05:00 - {String(closeHour).padStart(2, '0')}:00)
                              </h2>
                              <div className='flex flex-wrap gap-2'>
                                {eveningSlots.map((time) => {
                                  const disabled = isSlotDisabled(time)
                                  const booked = isSlotBooked(time)
                                  
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => handleSlotClick(time)}
                                      disabled={disabled}
                                      className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? booked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                                    >
                                      {formatTimeToAMPM(time)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )
              ) : (
                <TimeSlotsectionSkeleton />
              )}
            </div>

            {/* Multi-Barber Booking Modal Component */}
            <MultiBarberBookingModal
              showBarberSelection={showBarberSelection}
              multiBarberBookings={multiBarberBookings}
              BookedSlots={BookedSlots}
              shopDetails={shopDetails}
              selectedBarber={selectedBarber}
              currentDay={currentDay}
              allTimeSlots={allTimeSlots}
              formatTimeToAMPM={formatTimeToAMPM}
              getDayNames={getDayNames}
              getClosingTime={getClosingTime}
              handleCancelMultiBooking={handleCancelMultiBooking}
              handleRemoveBarberBooking={handleRemoveBarberBooking}
              handleSelectBarberSlot={handleSelectBarberSlot}
              handlePreviousDay={handlePreviousDay}
              handleNextDay={handleNextDay}
              handleBookNow={handleBookNow}
              bookingLoading={bookingLoading}
              setSelectedBarber={setSelectedBarber}
              setSlotInterval={setSlotInterval}
              isSlotDisabled={isSlotDisabled}
              dates={dates}
            />

            {/* Service Selection Modal */}
            {showServiceModal && (
              <div className="fixed inset-0 bg-[#0000008c] bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-[#A89FFB] rounded-2xl p-6 max-w-sm w-full mx-4 relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowServiceModal(false);
                      setSelectedServices([]);
                      setServiceSearchQuery('');
                      if (multiBarberBookings.length > 0) {
                        setShowBarberSelection(true);
                      }
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ✕
                  </button>

                  <h3 className="text-xl font-bold mb-2 text-center">Choose Services</h3>
                  <p className="text-center text-gray-700 font-semibold mb-2">
                    {BookedSlots && BookedSlots.find(b => b._id === currentBookingBarber)?.name}
                  </p>
                  <div className='w-full text-center text-gray-800 bg-[#c3bcfb] rounded-xl p-3 mb-4'>
                    <p className="text-sm text-red-700">• Please Arrive 5 minutes before your booking time to avoid auto booking cancellation</p>
                    <p className="text-sm font-semibold mt-1">Time: {currentBookingSlot && formatTimeToAMPM(currentBookingSlot)}</p>
                  </div>

                  {/* Service Search Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3 mb-2 overflow-y-auto max-h-[40vh]">
                    {(() => {
                      const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === currentBookingBarber);
                      const services = shopDetail ? shopDetail.services : [];
                      
                      // Filter services based on search query
                      const filteredServices = serviceSearchQuery.trim()
                        ? services.filter(service => 
                            service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                          )
                        : services;
                      
                      if (filteredServices.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-600">
                            {serviceSearchQuery.trim() 
                              ? `No services found matching "${serviceSearchQuery}"`
                              : 'No services available'}
                          </div>
                        );
                      }
                      
                      return filteredServices.map((service, index) => (
                        <div
                          key={service._id}
                          onClick={() => toggleService(service.name)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedServices.includes(service.name)
                            ? 'bg-purple-100 border-purple-400'
                            : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedServices.includes(service.name)
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-300'
                              }`}>
                              {selectedServices.includes(service.name) && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <span className="font-medium">{index+1}. {service.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{service.duration} min</div>
                            <div className="text-sm text-gray-500">₹{service.price}</div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>

                  {/* Two buttons: Add More and Book Now */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddMoreBarbers}
                      disabled={selectedServices.length === 0}
                      className="flex-1 bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add More
                    </button>
                    <button
                      onClick={handleBookNow}
                      disabled={bookingLoading || selectedServices.length === 0}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookYourSlot