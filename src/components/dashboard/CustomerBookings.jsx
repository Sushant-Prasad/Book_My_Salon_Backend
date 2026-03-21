import React, { useState, useEffect } from 'react'
import { useGetBookingsQuery, useUpdateBookingStatusMutation } from '../../redux/api/api'
import toast from 'react-hot-toast'
import Pagination from './Pagination'

const CustomerBookings = () => {
  const [filter, setFilter] = useState('today') // all, today, upcoming, completed
  const [currentPage, setCurrentPage] = useState(1)
  
  // RTK Query hooks
  const { data: bookingsData, isLoading: loading, error, refetch } = useGetBookingsQuery({
    page: currentPage,
    limit: 10,
    filter: filter !== 'all' ? filter : undefined
  });
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  // console.log("Bookings Data:", bookingsData);
  
  const bookings = bookingsData?.data?.data || [];
  const pagination = bookingsData?.data?.pagination || {
    current_page: 1,
    total_pages: 1,
    total_bookings: 0
  };

  // Handle RTK Query error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Error loading bookings</p>
            <p>{error?.data?.message || 'Failed to fetch bookings'}</p>
            <button 
              onClick={() => refetch()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

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
    if (!bookings || bookings.length === 0) {
      return []
    }

    const now = new Date()
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    today.setHours(0, 0, 0, 0)

    switch (filter) {
      case 'today':
        return bookings.filter(booking => {
          // Handle the ISO date string from your data: "2025-11-09T18:30:00.000Z"
          const bookingDate = new Date(booking.date)
          const bookingDateIndia = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
          bookingDateIndia.setHours(0, 0, 0, 0)
          return bookingDateIndia.getTime() === today.getTime()
        })
      case 'upcoming':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          const bookingDateIndia = new Date(bookingDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
          bookingDateIndia.setHours(0, 0, 0, 0)
          return bookingDateIndia > today &&  booking.status !== 'cancelled'
        })
      case 'completed':
        return bookings.filter(booking => booking.status === 'completed')
      default:
        
        return bookings

    }
  }


  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const filteredBookings = getFilteredBookings()
  // console.log("Filtered Bookings:", filteredBookings);  

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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Customer Bookings</h2>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'today', label: 'Today', color: 'bg-[#645CAD]' },
            { key: 'upcoming', label: 'Upcoming', color: 'bg-[#988bf7]' },
            { key: 'completed', label: 'Completed', color: 'bg-green-500' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${filter === key ? color : 'bg-gray-300 text-gray-600'
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
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No bookings found</div>
            <p className="text-gray-400 mt-2">Bookings will appear here once customers make appointments</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
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
                  <div className="flex w-full sm:items-center items-start justify-between mb-2">
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

                  {/* Status and Actions */}
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
                      {booking.payment?.charAt(0).toUpperCase() + booking.payment?.slice(1) || 'Pending'}
                    </span>

                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        {booking.status === 'booked' && (
                          <button
                            onClick={() => 
                              updateBookingStatus({id: booking._id, status: 'arrived'})}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {booking.status === 'arrived' && (
                          <button
                            onClick={() => updateBookingStatus({id: booking._id, status: 'completed'})}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination 
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalLabel="total bookings"
      />
    </div>
  )
}

export default CustomerBookings