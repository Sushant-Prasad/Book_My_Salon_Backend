import React, { useEffect, useState } from 'react'
import HairCut from '../assets/haircut.jpg'
import HairColor from '../assets/haircolor.webp'
import Shaving from '../assets/shaving.jpg'
import FacialMassage from '../assets/massage.jpg'
import SpotlightCard from '../components/SpotlightCard';
import Carousel from '../components/Carousel';
import CustomerReviews from '../components/CustomerReviews';
import { FaFacebook } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { useSelector } from 'react-redux'
import {
  BookingSkeleton,
  TeamSkeleton,
} from '../components/Skeleton'
import toast from 'react-hot-toast'
import BarberBookingsPage from './BarberBookingsPage'
import BookYourSlot from '../components/BookYourSlot'
import { CiMenuKebab } from 'react-icons/ci'
import { useLocation } from 'react-router-dom'
import {
  useGetCustomerBookingsQuery,
  useGetBookedSlotsQuery,
  useGetAdminInfoQuery,
  useCancelBookingMutation,
  useGetOurTeamQuery
} from '../redux/api/api'

const Home = () => {
  // Sample dynamic data - in real app this would come from API/state management
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Redux API hooks
  const {
    data: customerBookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings
  } = useGetCustomerBookingsQuery(undefined, {
    skip: !user || user.role !== 'customer'
  });

  const {
    data: bookedSlotsData,
    isLoading: slotsLoading,
    refetch: refetchSlots
  } = useGetBookedSlotsQuery();

  const {
    data: adminInfo,
    isLoading: adminInfoLoading
  } = useGetAdminInfoQuery();

  const {
    data: ourTeamData,
    isLoading: ourTeamLoading,
  } = useGetOurTeamQuery();


  const [cancelBooking] = useCancelBookingMutation();

  // Extract data from Redux responses
  const bookings = customerBookings?.data || [];
  const BookedSlots = bookedSlotsData?.data || [];
  const shopDetails = bookedSlotsData?.shopDetails || [];
  const shopInfo = adminInfo?.data || null;
  

  // Add CSS animation
  React.useEffect(() => {
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

  // Handle loading state
  useEffect(() => {
    if (!slotsLoading) {
      setLoading(false);
    }
  }, [slotsLoading]);

  // Refresh data function for BookYourSlot component
  const fetchBookings = () => {
    // Only refetch customer bookings if user is a customer
    if (user && user.role === 'customer') {
      refetchBookings();
    }
    refetchSlots();
  };  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const getDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  const [services] = useState([
    {
      id: 1,
      name: "Men's Haircut",
      img: HairCut,
      icon: "✂️",
      description: "Get your hair cut based on your face shape, professionally styled."
    },
    {
      id: 2,
      name: "Beard Trim",
      img: Shaving,
      icon: "🧔",
      description: "Keep your beard looking fresh with a lot of extra attention with clippers."
    },
    {
      id: 3,
      name: "Treatment",
      img: FacialMassage,
      icon: "💆",
      description: "Leave it to us and our professional stylist to keep your hair healthy."
    },
    {
      id: 4,
      name: "Wash",
      img: HairColor,
      icon: "🚿",
      description: "Nourish your hair and scalp with a full wash using our exclusive products."
    }
  ])

  // Generate time slots (10:00 to 21:00 with 15 min intervals)

  // Handle cancel booking
  const handleCancelBooking = async (bookingId, payment_status) => {
    try {
      setCancelling(true);
      const response = await cancelBooking({
        bookingId,
        payment_status
      }).unwrap();

      toast.success(response.message);

      // Refresh bookings and slots after successful cancellation
      refetchBookings();
      refetchSlots();

      setOpenDropdownId(null); // Close dropdown
    } catch (error) {
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (bookingId) => {
    setOpenDropdownId(openDropdownId === bookingId ? null : bookingId);
  };


  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-md mx-auto bg-[#D4DAFF] space-y-6 p-5 rounded-2xl">
        {/* Your Bookings Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            {user && user.role === 'customer' ? "Your Bookings" : "Customer Bookings"}
          </h2>
          <div>
            {user && user.role === 'barber' ? (
              // Show barber booking management component
              <BarberBookingsPage />
            ) : (
              // Show customer bookings
              <>
                {bookingsLoading ? (
                  // Show skeleton loading for bookings
                  <>
                    <BookingSkeleton />
                    <BookingSkeleton />
                    <BookingSkeleton />
                  </>
                ) : (
                  bookings.length === 0 ? (
                    <div key={1} className="flex gap-4 bg-white rounded-lg p-4 shadow mb-4 justify-center">
                      <div className="text-center text-gray-600">No bookings found.</div>
                    </div>
                  ) : (
                    user && user.role === 'customer' && bookings.map((booking) => (
                      <div key={booking._id} className="bg-white rounded-lg p-4 shadow-sm mb-4">
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
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-sm bg-[#988bf7] text-white px-2 py-1 rounded-full">
                                    {getDate(booking.date)}
                                  </span>
                                </div>
                              </div>
                              <div className='w-fit relative dropdown-container'>
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
                                {openDropdownId === booking._id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handleCancelBooking(booking._id, booking.payment)
                                        }}
                                        disabled={cancelling}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      >
                                        {cancelling ? 'Cancelling...' : '🚫 Cancel Booking'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Service Providers */}
                            {booking.serviceProviders && booking.serviceProviders.length > 0 ? (
                              <div className="space-y-3 mb-3">
                                {booking.serviceProviders.map((provider, index) => (
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
                                        {provider.start_time && provider.end_time && (
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="text-xs bg-[#988bf7] text-white px-2 py-1 rounded-full">
                                              {provider.start_time} - {provider.end_time}
                                            </span>
                                            <span className="text-xs bg-[#A89FFB] text-white px-2 py-1 rounded-full">
                                              {provider.service_time} min
                                            </span>
                                          </div>
                                        )}
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
                            ) : (
                              // Fallback for old structure
                              booking.services && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {booking.services.map((service, index) => (
                                      <span key={index} className="text-xs bg-[#dac9fd] text-gray-700 px-2 py-1 rounded">
                                        {service}
                                      </span>
                                    ))}
                                  </div>
                                  {booking.start_time && (
                                    <span className="text-sm text-gray-600 bg-[#dac9fd] rounded-full w-fit px-2.5">
                                      {booking.start_time}
                                    </span>
                                  )}
                                </div>
                              )
                            )}

                            {/* Status */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                              {booking.payment && (
                                <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.payment === 'pending' ? 'bg-gray-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                  }`}>
                                  {booking.payment.charAt(0).toUpperCase() + booking.payment.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Notice Board Set By Admin */}
        {shopInfo && shopInfo.notice !== "" && (
          <div className="bg-red-100 p-4 rounded-lg shadow">
            <h2 className="text-lg text-center font-semibold text-gray-800 mb-2">Notice Board</h2>
            <p className="text-gray-600 text-sm">●{" "}{shopInfo.notice}</p>
          </div>
        )}

        {/* Carousel Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Menu</h2>
          <Carousel />
        </div>

        {/* Book Your Slot Section */}
        <BookYourSlot path={location.pathname} shopInfo={shopInfo} userRole={user && user.role} refechBooking={fetchBookings} />

        {/* Services Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Barber <span className="text-gray-500">Services</span></h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {services.map((service) => (
              <div key={service.id} className="relative bg-[#b8a4ff] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden w-[calc(50%-8px)] min-w-[194px]">
                {/* Service Image Background */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    loading="lazy"
                    src={service.img}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0  bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>


                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2 text-center text-sm">{service.name}</h3>
                  <p className="text-xs text-gray-600 text-center leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
        <CustomerReviews availableBarbers={BookedSlots || []} user={user} />

        {/* Team Section */}
        <div >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Our Team</h2>
          <div className='flex flex-col gap-4 overflow-x-auto'>
            {loading ? (
              // Show skeleton loading for team
              <>
                <TeamSkeleton />
                <TeamSkeleton />
              </>
            ) : (
              ourTeamData && ourTeamData.data.map((barber) => (
                <SpotlightCard
                  key={barber.barberId} className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.2)">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <img src={barber?.profileUrl} alt={barber.barberName} loading="lazy" className="w-20 h-20 object-cover rounded-full mb-2" />
                    <div className="text-md font-medium text-gray-800">{barber?.barberName}</div>
                    <div className="text-sm text-gray-600">{barber?.rating > 0 ? `Rating: ${barber?.rating}` : ""}</div>
                  </div>
                </SpotlightCard>
              ))
            )}
          </div>
        </div>


        {/* Contact Card */}
        <ContactCard shopInfo={shopInfo} shop_address={shopDetails && shopDetails[0]?.shop_address} number={shopDetails && shopDetails[0]?.phone} />
      </div>
    </div>
  )
}



// ContactCard Component
const ContactCard = ({ shopInfo, shop_address, number }) => {
  return (
    <div className="bg-[#645CAD] rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-2">Barber Shop</h2>
      <p className="text-purple-100 mb-4 text-sm">
        Experience The Best New Hairstyles in Our Hair Salon. Just
        Book Your Desire Day from Now on and Easily Style Your Hair
      </p>

      {/* Social Icons */}
      <div className="flex space-x-3 mb-4">
        <div className="w-8 h-8 text-black bg-transparent bg-opacity-20 rounded flex items-center justify-center"><FaFacebook /></div>
        <div className="w-8 h-8 text-black bg-transparent bg-opacity-20 rounded flex items-center justify-center"><AiFillInstagram /></div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>✉️</span>
            <span>{shopInfo && shopInfo.shop_email || 'support@barber.com'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📞</span>
            <span>+91 {shopInfo && shopInfo.shop_phone || number} </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <div>
              <span>{shopInfo && shopInfo.shop_address || shop_address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-purple-200">
        © 2025 barber shop. All rights reserved.
      </div>
    </div>
  )
}

export default Home