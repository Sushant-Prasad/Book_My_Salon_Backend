import React from 'react';
import left from '../assets/left.png';
import right from '../assets/next.png';

const MultiBarberBookingModal = ({
  showBarberSelection,
  multiBarberBookings,
  BookedSlots,
  shopDetails,
  selectedBarber,
  currentDay,
  allTimeSlots,
  formatTimeToAMPM,
  getDayNames,
  getClosingTime,
  handleCancelMultiBooking,
  handleRemoveBarberBooking,
  handleSelectBarberSlot,
  handlePreviousDay,
  handleNextDay,
  handleBookNow,
  bookingLoading,
  setSelectedBarber,
  setSlotInterval,
  isSlotDisabled,
  dates
}) => {
  if (!showBarberSelection) return null;
  

  return (
    <div className="fixed inset-0 bg-[#0000008c] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl p-4 max-w-2xl w-full my-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleCancelMultiBooking}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Add More Services</h3>
        <p className="text-center text-sm text-gray-600 mb-4">Select another barber and time slot</p>

        {/* Show already added barbers */}
        {multiBarberBookings.length > 0 && (
          <div className="mb-4 bg-purple-50 rounded-xl p-3 border border-purple-200">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">✅ Already Selected:</h4>
            <div className="space-y-2">
              {multiBarberBookings.map((booking, index) => {
                const shopDetail = shopDetails.find(shop => shop.barber_id === booking.barber_id);
                const totalPrice = booking.services.reduce((sum, serviceName) => {
                  const service = shopDetail?.services.find(s => s.name.trim() === serviceName.trim());
                  return sum + (service?.price || 0);
                }, 0);

                return (
                  <div key={index} className="bg-white rounded-lg p-2 border border-gray-200 flex justify-between items-center">
                    <div className="flex gap-2 items-center flex-1">
                      <img src={booking.barber_photo} alt={booking.barber_name} className="w-10 h-10 rounded-full border-2 border-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{booking.barber_name}</p>
                        <p className="text-xs text-gray-600">
                          {formatTimeToAMPM(booking.start_time)} - {(() => {
                            const [hours, minutes] = booking.start_time.split(':').map(Number);
                            const totalMinutes = hours * 60 + minutes + booking.service_time;
                            const endHours = Math.floor(totalMinutes / 60);
                            const endMinutes = totalMinutes % 60;
                            const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                            return formatTimeToAMPM(endTime);
                          })()} • ₹{totalPrice}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {booking.services.slice(0, 2).map((service, i) => (
                            <span key={i} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              {service}
                            </span>
                          ))}
                          {booking.services.length > 2 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              +{booking.services.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBarberBooking(index)}
                      className="text-red-500 hover:text-red-700 font-bold text-lg ml-2"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Same UI as main page */}
        <div className="flex flex-col items-center">
          {/* Horizontal Barber Scroll - Same as main page */}
          <div className="w-full flex justify-center items-center mb-4">
            <div className={`flex gap-4 justify-start px-4 ${BookedSlots && BookedSlots.length > 5 ? 'overflow-x-auto pb-2' : 'justify-center'} max-w-full`}>
              {BookedSlots && BookedSlots.map((barber, index) => (
                <div
                  key={barber._id}
                  className={`flex flex-col w-[48px] gap-2 cursor-pointer ${selectedBarber === index ? 'opacity-100' : 'opacity-50'}`}
                  onClick={() => {
                    setSelectedBarber(index);
                    for (let i = 0; i < shopDetails.length; i++) {
                      if (barber._id === shopDetails[i].barber_id) {
                        setSlotInterval(shopDetails && shopDetails[i].slot_interval);
                      } else {
                        setSlotInterval(15);
                      }
                    }
                  }}
                >
                  <img
                    src={barber.photoUrl}
                    alt={barber.name}
                    loading="lazy"
                    className={`rounded-full border-2 w-12 h-12 ${selectedBarber === index ? 'border-indigo-600' : 'border-indigo-400'}`}
                  />
                  <div className={`h-1 w-[48px] rounded ${selectedBarber === index ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <p className="text-xs text-center font-medium whitespace-wrap">{barber.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Purple themed time slot section - Same as main page */}
          <div className='bg-[#A89FFB] flex flex-col items-center rounded-2xl p-2 relative overflow-hidden w-full'>
            {/* Date Navigation - Same as main page */}
            <div className='flex gap-2 w-full justify-between items-center mb-4'>
              <button
                onClick={handlePreviousDay}
                disabled={currentDay === 0}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${currentDay === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#dac9fd] hover:bg-opacity-20'}`}
              >
                <img src={left} alt="Previous" loading="lazy" className='w-6' />
              </button>

              <div className="text-sm text-gray-700 bg-[#dac9fd] rounded-full px-3 py-2 font-medium">
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

            {/* Time Slots - Same as main page */}
            {(() => {
              const shopDetail = shopDetails && shopDetails.find(shop => shop.barber_id === (BookedSlots && BookedSlots[selectedBarber] ? BookedSlots[selectedBarber]._id : null));
              const openHour = shopDetail && shopDetail.opening_hours ? parseInt(shopDetail.opening_hours.start.split(':')[0]) : 10;
              const closeHour = getClosingTime(currentDay, selectedBarber);
              
              // Get booked slots for this barber
              const dayKeys = ['today', 'next_day', 'next_second_day'];
              const bookedSlots = BookedSlots[selectedBarber] ? (BookedSlots[selectedBarber][dayKeys[currentDay]] || []) : [];
              
              // Morning slots
              const morningSlots = allTimeSlots.filter(slot => {
                const hour = parseInt(slot.split(':')[0]);
                return hour >= openHour && hour < 12;
              });
              
              // Afternoon slots
              const afternoonSlots = allTimeSlots.filter(slot => {
                const hour = parseInt(slot.split(':')[0]);
                const maxHour = closeHour < 17 ? closeHour : 17;
                return hour >= 12 && hour < maxHour;
              });
              
              // Evening slots
              const eveningSlots = closeHour > 17 ? allTimeSlots.filter(slot => {
                const hour = parseInt(slot.split(':')[0]);
                return hour >= 17 && hour < closeHour;
              }) : [];

              return (
                <div className='w-full'>
                  {/* Morning Slots */}
                  {morningSlots.length > 0 && (
                    <div className='w-full mb-4'>
                      <h2 className='ml-2 text-[#0c1448] font-semibold mb-2 text-sm'>
                        Morning ({shopDetail && shopDetail.opening_hours ? shopDetail.opening_hours.start : '10:00'} - 12:00)
                      </h2>
                      <div className='flex flex-wrap gap-2'>
                        {morningSlots.map((time) => {
                          const disabled = isSlotDisabled(time);
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <button
                              key={time}
                              onClick={() => !disabled && handleSelectBarberSlot(selectedBarber, time)}
                              disabled={disabled}
                              className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? isBooked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                            >
                              {formatTimeToAMPM(time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Afternoon Slots */}
                  {afternoonSlots.length > 0 && (
                    <div className='w-full mb-4'>
                      <h2 className='ml-2 text-[#0c1448] font-semibold mb-2 text-sm'>
                        Afternoon (12:00 - {closeHour < 17 ? `${String(closeHour).padStart(2, '0')}:00` : '05:00'})
                      </h2>
                      <div className='flex flex-wrap gap-2'>
                        {afternoonSlots.map((time) => {
                          const disabled = isSlotDisabled(time);
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <button
                              key={time}
                              onClick={() => !disabled && handleSelectBarberSlot(selectedBarber, time)}
                              disabled={disabled}
                              className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? isBooked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                            >
                              {formatTimeToAMPM(time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Evening Slots */}
                  {eveningSlots.length > 0 && (
                    <div className='w-full'>
                      <h2 className='ml-2 text-[#0c1448] font-semibold mb-2 text-sm'>
                        Evening (05:00 - {String(closeHour).padStart(2, '0')}:00)
                      </h2>
                      <div className='flex flex-wrap gap-2'>
                        {eveningSlots.map((time) => {
                          const disabled = isSlotDisabled(time);
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <button
                              key={time}
                              onClick={() => !disabled && handleSelectBarberSlot(selectedBarber, time)}
                              disabled={disabled}
                              className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${disabled
                                        ? isBooked
                                          ? 'bg-red-200 border-red-400 text-red-700 cursor-not-allowed opacity-60'
                                          : 'bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-60'
                                        : 'bg-[#F0E9FF] border-[#C18EFF] text-gray-700 hover:bg-purple-100 cursor-pointer'
                                        }`}
                            >
                              {formatTimeToAMPM(time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2 w-full">
            <button
              onClick={handleCancelMultiBooking}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleBookNow}
              disabled={multiBarberBookings.length === 0 || bookingLoading}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {bookingLoading ? 'Booking...' : `Book All (${multiBarberBookings.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiBarberBookingModal;
