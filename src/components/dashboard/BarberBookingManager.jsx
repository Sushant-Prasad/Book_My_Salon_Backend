import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Pagination from './Pagination'
import { CiMenuKebab } from "react-icons/ci";
import {
  useGetBookingsQuery,
  useAddToSpamListMutation,
  useMakeSlotAvailableMutation,
  useUpdateBookingStatusMutation
} from '../../redux/api/api'

const BarberBookingManager = () => {
  const [filter, setFilter] = useState('today') // today, upcoming
  const [currentPage, setCurrentPage] = useState(1)
  const [showSpamModal, setShowSpamModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [spamReason, setSpamReason] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)

  // Redux hooks
  const { 
    data: bookingsData, 
    isLoading: loading, 
    refetch: refetchBookings 
  } = useGetBookingsQuery({ 
    status: '', 
    page: currentPage, 
    limit: 15,
    filter: filter 
  })
   
 const [updateBookingStatus] = useUpdateBookingStatusMutation()

  // console.log('bookingsData', bookingsData)
  
  const [addToSpamList, { isLoading: spamLoading }] = useAddToSpamListMutation()
  const [makeSlotAvailable, { isLoading: slotLoading }] = useMakeSlotAvailableMutation()
  
  const bookings = bookingsData?.data?.data || []
  const pagination = bookingsData?.data?.pagination || {
    current_page: 1,
    total_pages: 1,
    total_items: 0
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }
    
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])



  const getDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilteredBookings = () => {
    // Backend now handles filtering via the filter parameter
    if (!bookings || bookings.length === 0) {
      return []
    }

    const now = new Date()
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    today.setHours(0, 0, 0, 0)

    switch (filter) {
      case 'today':
        return bookings && bookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          const bookingDateIndia = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
          bookingDateIndia.setHours(0, 0, 0, 0)
          return bookingDateIndia.getTime() === today.getTime()
        })
      case 'upcoming':
        return bookings && bookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          const bookingDateIndia = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
          bookingDateIndia.setHours(0, 0, 0, 0)
          return bookingDateIndia > today && booking.status !== 'cancelled'
        })
      
      default:
        return bookings && bookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          const bookingDateIndia = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
          bookingDateIndia.setHours(0, 0, 0, 0)
          return bookingDateIndia.getTime() === today.getTime()
        })
    }
  }


  // Add customer to spam list
  const handleAddToSpam = async (booking) => {
    try {
      const result = await addToSpamList({
        phone: booking.customerdetails?.customer_phone,
        reason: spamReason || 'Added from booking management'
      }).unwrap()

      toast.success('Customer added to spam list and bookings removed')
      setShowSpamModal(false)
      setSpamReason('')
      refetchBookings() // Refresh the bookings list
    } catch (error) {
      toast.error(error.message || 'Failed to add customer to spam list')
    }
  }

  // Mark slot as available (cancel booking)
  const handleMarkAvailable = async (booking) => {
    try {
      const result = await makeSlotAvailable({
        id: booking._id,
        payment_status: booking.payment
      }).unwrap()

      toast.success('Booking cancelled - Slot is now available')
      refetchBookings() // Refresh the bookings list
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking')
    }
  }

  

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const toggleDropdown = (bookingId) => {
    setActiveDropdown(activeDropdown === bookingId ? null : bookingId)
  }

  const filteredBookings = getFilteredBookings()

  const BookingSkeleton = () => (
    <div className="bg-[#D4DAFF] rounded-lg p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-300 rounded w-16"></div>
            <div className="h-6 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
              { key: 'today', label: 'Today', color: 'bg-[#645CAD]' },
            { key: 'upcoming', label: 'Upcoming', color: 'bg-[#988bf7]' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${filter === key ? color : 'bg-[#afaeda] text-gray-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <>
            <BookingSkeleton />
            <BookingSkeleton />
            <BookingSkeleton />
          </>
        ) : (
          filteredBookings && filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg">No bookings found</div>
              <p className="text-gray-400 mt-2">Customer bookings will appear here</p>
            </div>
          ) : (
            filteredBookings && filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-[#ffffff] rounded-lg p-4 shadow-sm">
              <div className="flex gap-4">
                {/* Customer Profile */}
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-[#645CAD] bg-[#645CAD] flex items-center justify-center text-white font-semibold">
                    {booking.customerdetails?.customer_name ? booking.customerdetails?.customer_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex  w-full sm:items-center items-start justify-between mb-2">
                    <div className='w-fit'>
                      <h3 className="font-semibold text-gray-800">
                        {booking.customerdetails?.customer_name || 'Unknown Customer'}
                      </h3>
                      <p className="text-sm text-gray-600">{booking.customerdetails?.customer_phone || 'No phone'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-2">
                      <span className="text-sm bg-[#988bf7] text-white px-2 py-1 rounded-full">
                        {getDate(booking.date)}
                      </span>
                    </div>
                    </div>
                      <div className='w-fit relative'>
                        <button 
                          className='cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors'
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDropdown(booking._id)
                          }}
                        >
                          <CiMenuKebab />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === booking._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              {/* <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setShowReplaceModal(true)
                                  setActiveDropdown(null)
                                }}
                                disabled={actionLoading}
                                className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                              >
                                🔄 Replace with Walk-in
                              </button> */}
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setShowSpamModal(true)
                                  setActiveDropdown(null)
                                }}
                                disabled={spamLoading || slotLoading}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                🚫 Add to Spam List
                              </button>
                              <button
                                onClick={() => {
                                  handleMarkAvailable(booking)
                                  setActiveDropdown(null)
                                }}
                                disabled={spamLoading || slotLoading}
                                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                              >
                                📅 Make Available
                              </button>
                              {booking && booking.status === 'booked' && (
                                <button
                                onClick={() => {
                                  updateBookingStatus({id: booking._id, status: 'arrived'})
                                  setActiveDropdown(null)
                                }}
                                disabled={spamLoading || slotLoading}
                                className="w-full text-left px-3 py-2 text-sm text-green-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                              >
                                🚶 Arrived
                              </button>)}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* Service Providers */}
                  <div className="space-y-3 mb-3">
                    {booking.serviceProviders && booking.serviceProviders.map((provider, index) => (
                      <div key={provider._id || index} className="bg-[#f3f4f6] rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={provider.barber_id?.profileUrl || '/default-avatar.png'}
                            alt={provider.barber_id?.name}
                            className="w-10 h-10 rounded-full border-2 border-purple-300 object-cover"
                            onError={(e) => { e.target.src = '/default-avatar.png' }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {provider.barber_id?.name || 'Unknown Barber'}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs bg-[#988bf7] text-white px-2 py-1 rounded-full">
                                {provider.start_time} - {provider.end_time}
                              </span>
                              <span className="text-xs bg-[#A89FFB] text-white px-2 py-1 rounded-full">
                                {provider.service_time} min
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.services && provider.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-[#b0a1ff] text-gray-700 px-2 py-1 rounded"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status and Standard Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.payment === 'pending' ? 'bg-gray-100 text-red-800' :
                       'bg-blue-100 text-blue-800' 
                      }`}>
                      {booking.payment.charAt(0).toUpperCase() + booking.payment.slice(1)}
                    </span>

                    {/* Standard Status Update Buttons */}
                    
                  </div>
                </div>
              </div>
            </div>
          ))
          )
        )}
      </div>

      {/* Pagination */}
      <Pagination 
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalLabel="total bookings"
      />

      

      {/* Spam Modal */}
      {showSpamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add to Spam List</h3>
            <p className="text-gray-600 mb-4">
              Adding <strong>{selectedBooking?.customer_id?.name}</strong> to spam list will remove all their bookings and prevent future bookings.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={spamReason}
                onChange={(e) => setSpamReason(e.target.value)}
                placeholder="Enter reason for adding to spam list..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#645CAD]"
                rows="3"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSpamModal(false)
                  setSpamReason('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddToSpam(selectedBooking)}
                disabled={spamLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {spamLoading ? 'Adding...' : 'Add to Spam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BarberBookingManager