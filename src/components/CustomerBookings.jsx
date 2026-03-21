import React, { useState } from 'react'
import { CiMenuKebab } from 'react-icons/ci'
import { FiEdit2, FiSave, FiX, FiPrinter, FiTrash2 } from 'react-icons/fi'
import { generateReceipt } from '../utils/features'
import toast from 'react-hot-toast'
import Pagination from './dashboard/Pagination'
import ServiceSelectionModal from './ServiceSelectionModal'
import { useCancelBookingMutation, useUpdateBookingMutation, useCreateOfflineBookingMutation, useUpdateBookingStatusMutation } from '../redux/api/api'



const CustomerBookings = ({ bookingsData, onRefreshData, availableBarbers = [], onPageChange, currentPage = 1, shopDetails = [] }) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [discounts, setDiscounts] = useState({}); // Store discount for each booking
  const [paymentFilter, setPaymentFilter] = useState('pending'); // Filter state with pending as default
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering by name or phone
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedBarberForService, setSelectedBarberForService] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [editedServiceProviders, setEditedServiceProviders] = useState([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  // New billing state
  const [showNewBillingModal, setShowNewBillingModal] = useState(false);
  const [newBillServiceProviders, setNewBillServiceProviders] = useState([]);
  const [newBillDiscount, setNewBillDiscount] = useState(0);
  const [newBillCustomer, setNewBillCustomer] = useState({
    name: '',
    phone: ''
  });
  const [generatingNewBill, setGeneratingNewBill] = useState(false);

  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentStatus: ''
  });



  // RTK Query hooks
  const [updateBooking] = useUpdateBookingMutation();
  const [cancelBooking] = useCancelBookingMutation();
  const [createOfflineBooking] = useCreateOfflineBookingMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  // Get formatted date
  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get formatted time range
  const getTimeRange = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  // Calculate duration in minutes
  const getDuration = (serviceTime) => {
    return `${serviceTime} min`;
  };

  // Get service price from shop details
  const getServicePrice = (serviceName, barberId) => {
    const shop = shopDetails.find(shop => shop.barber_id === barberId);
    if (!shop) return 0;
    const service = shop.services.find(service => service.name.trim() === serviceName.trim());
    return service ? service.price : 0;
  };

  // Calculate total price for a booking with multiple service providers
  const calculateTotalPrice = (booking, customProviders = null) => {
    // Use customProviders if provided (for edit mode), otherwise use booking data
    const providers = customProviders || booking.serviceProviders;

    let subtotal = 0;

    if (providers && providers.length > 0) {
      subtotal = providers.reduce((total, provider) => {
        const barberId = provider.barber_id?._id || provider.barber_id;
        const providerTotal = provider.services.reduce((sum, serviceName) => {
          return sum + getServicePrice(serviceName, barberId);
        }, 0);
        return total + providerTotal;
      }, 0);
    } else if (booking.services && booking.barber_id) {
      // Fallback for old structure
      subtotal = booking.services.reduce((total, serviceName) => {
        return total + getServicePrice(serviceName, booking.barber_id._id);
      }, 0);
    }

    const discount = booking.discount_applied || discounts[booking._id] || 0;
    const discountAmount = (subtotal * discount) / 100;
    return {
      subtotal,
      discount,
      discountAmount,
      total: subtotal - discountAmount
    };
  };

  // Handle discount change
  const handleDiscountChange = (bookingId, discountValue) => {
    const numericDiscount = Math.max(0, Math.min(100, parseFloat(discountValue) || 0));
    setDiscounts(prev => ({
      ...prev,
      [bookingId]: numericDiscount
    }));
  };

  // Filter bookings based on payment status and search query
  const getFilteredBookings = () => {
    if (!bookingsData || !bookingsData.bookings) return [];

    let filtered = bookingsData.bookings;

    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const paymentStatus = booking.payment || 'pending';
        if (paymentFilter === 'paid') {
          return paymentStatus === 'completed' || paymentStatus === 'paid';
        }
        return paymentStatus === 'pending';
      });
    }

    // Filter by search query (customer name or phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(booking => {
        const customerName = booking.customerdetails?.customer_name?.toLowerCase() || '';
        const customerPhone = booking.customerdetails?.customer_phone?.toLowerCase() || '';
        return customerName.includes(query) || customerPhone.includes(query);
      });
    }

    return filtered;
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setPaymentFilter(filter);
  };



  // Handle dropdown toggle
  const toggleDropdown = (bookingId) => {
    setOpenDropdownId(openDropdownId === bookingId ? null : bookingId);
  };

  // Handle edit mode toggle
  const handleEditClick = (booking) => {
    setEditingBookingId(booking._id);
    setEditForm({
      customerName: booking.customerdetails?.customer_name,
      customerPhone: booking.customerdetails?.customer_phone,
      paymentStatus: booking.payment || 'pending'
    });
    // Initialize edited service providers from booking
    setEditedServiceProviders(booking.serviceProviders || []);
    setOpenDropdownId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setEditForm({
      customerName: '',
      customerPhone: '',
      paymentStatus: ''
    });
    setEditedServiceProviders([]);
    setShowServiceModal(false);
    setSelectedBarberForService('');
    setSelectedServices([]);
    setServiceSearchQuery('');
  };

  // Handle add more services
  const handleAddMore = () => {
    setShowServiceModal(true);
    setSelectedBarberForService('');
    setSelectedServices([]);
  };

  // Handle add more services for new bill
  const handleAddMoreForNewBill = () => {
    setShowServiceModal(true);
    setSelectedBarberForService('');
    setSelectedServices([]);
  };

  // Toggle service selection
  const toggleServiceSelection = (serviceName) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceName)) {
        return prev.filter(s => s !== serviceName);
      } else {
        return [...prev, serviceName];
      }
    });
  };

  // Handle done adding services
  const handleDoneAddingServices = () => {
    if (!selectedBarberForService || selectedServices.length === 0) {
      toast.error('Please select a barber and at least one service');
      return;
    }

    const barber = availableBarbers.find(b => b._id === selectedBarberForService);
    if (!barber) {
      toast.error('Barber not found');
      return;
    }

    const newProvider = {
      barber_id: {
        _id: barber._id,
        name: barber.name,
        gender: barber.gender || 'Male'
      },
      services: selectedServices
    };

    setEditedServiceProviders(prev => [...prev, newProvider]);
    setShowServiceModal(false);
    setSelectedBarberForService('');
    setSelectedServices([]);
  };

  // Handle delete service provider
  const handleDeleteProvider = (providerIndex) => {
    setEditedServiceProviders(prev => prev.filter((_, index) => index !== providerIndex));
  };

  // Handle save edit
  const handleSaveEdit = async (bookingId) => {
    try {
      const booking = bookingsData.bookings.find(b => b._id === bookingId);

      // Calculate service time for each provider and preserve existing time data
      const serviceProvidersWithTime = editedServiceProviders.map((provider, index) => {
        let totalServiceTime = 0;
        const barberId = provider.barber_id?._id || provider.barber_id;
        provider.services.forEach(serviceName => {
          const shop = shopDetails.find(s => s.barber_id === barberId);
          if (shop) {
            const service = shop.services.find(s => s.name.trim() === serviceName.trim());
            if (service) {
              totalServiceTime += service.duration;
            }
          }
        });

        // Find original provider data to preserve start_time, end_time, and booking_slots
        const originalProvider = booking.serviceProviders?.find(
          p => (p.barber_id?._id || p.barber_id) === barberId
        );

        const providerData = {
          barber_id: barberId,
          services: provider.services,
          service_time: totalServiceTime
        };

        // Preserve timing data if it exists in original booking (online booking)
        if (originalProvider) {
          if (originalProvider.start_time) providerData.start_time = originalProvider.start_time;
          if (originalProvider.end_time) providerData.end_time = originalProvider.end_time;
          if (originalProvider.booking_slots) providerData.booking_slots = originalProvider.booking_slots;
        }

        return providerData;
      });

      const totalPrice = calculateTotalPrice(booking, editedServiceProviders);

      await updateBooking({
        id: bookingId,
        customer_name: editForm.customerName,
        customer_phone: editForm.customerPhone,
        payment_status: editForm.paymentStatus,
        discount_applied: discounts[bookingId] || 0,
        total_amount_paid: totalPrice.total,
        serviceProviders: serviceProvidersWithTime
      });
      toast.success("Booking updated successfully");
      setEditingBookingId(null);
      setEditedServiceProviders([]);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update booking");
    }
  };

  // Handle new billing modal
  const handleOpenNewBilling = () => {
    setShowNewBillingModal(true);
    setNewBillServiceProviders([]);
    setNewBillCustomer({ name: '', phone: '' });
    setNewBillDiscount(0);
  };

  const handleCloseNewBilling = () => {
    setShowNewBillingModal(false);
    setNewBillServiceProviders([]);
    setNewBillCustomer({ name: '', phone: '' });
    setNewBillDiscount(0);
    setShowServiceModal(false);
    setSelectedBarberForService('');
    setSelectedServices([]);
    setServiceSearchQuery('');
  };

  // Handle add services to new bill
  const handleAddServicesToNewBill = () => {
    if (!selectedBarberForService || selectedServices.length === 0) {
      toast.error('Please select a barber and at least one service');
      return;
    }

    const barber = availableBarbers.find(b => b._id === selectedBarberForService);
    if (!barber) {
      toast.error('Barber not found');
      return;
    }

    const newProvider = {
      barber_id: selectedBarberForService,
      services: selectedServices
    };

    setNewBillServiceProviders(prev => [...prev, newProvider]);
    setShowServiceModal(false);
    setSelectedBarberForService('');
    setSelectedServices([]);
  };

  // Handle delete provider from new bill
  const handleDeleteProviderFromNewBill = (providerIndex) => {
    setNewBillServiceProviders(prev => prev.filter((_, index) => index !== providerIndex));
  };

  // Calculate total for new bill
  const calculateNewBillTotal = () => {
    let subtotal = 0;

    newBillServiceProviders.forEach(provider => {
      provider.services.forEach(serviceName => {
        subtotal += getServicePrice(serviceName, provider.barber_id);
      });
    });

    const discountAmount = (subtotal * newBillDiscount) / 100;
    return {
      subtotal,
      discount: newBillDiscount,
      discountAmount,
      total: subtotal - discountAmount
    };
  };

  // Handle generate new bill
  const handleGenerateNewBill = async () => {
    setGeneratingNewBill(true);
    if (!newBillCustomer.name || !newBillCustomer.phone) {
      toast.error('Please enter customer name and phone');
      return;
    }

    if (newBillServiceProviders.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    try {
      // Get current date in IST (India Standard Time)
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const today = istTime.toISOString().split('T')[0];

      // Calculate service time for each provider
      const serviceProvidersWithTime = newBillServiceProviders.map(provider => {
        let totalServiceTime = 0;
        provider.services.forEach(serviceName => {
          const shop = shopDetails.find(s => s.barber_id === provider.barber_id);
          if (shop) {
            const service = shop.services.find(s => s.name.trim() === serviceName.trim());
            if (service) {
              totalServiceTime += service.duration;
            }
          }
        });

        return {
          barber_id: provider.barber_id,
          services: provider.services,
          service_time: totalServiceTime
        };
      });

      await createOfflineBooking({
        serviceProviders: serviceProvidersWithTime,
        date: today,
        customer_name: newBillCustomer.name,
        customer_phone: newBillCustomer.phone,
        discount_applied: newBillDiscount,
        total_amount_paid: calculateNewBillTotal().total
      }).unwrap();

      toast.success("Bill generated successfully");
      handleCloseNewBilling();
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error(error?.data?.message || "Failed to generate bill");
    } finally {
      setGeneratingNewBill(false);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId, payment_status) => {
    try {
      const response = await cancelBooking({ bookingId, payment_status }).unwrap();
      toast.success(response.message || "Booking cancelled successfully");
      if (onRefreshData) onRefreshData();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel booking");
    }
    setOpenDropdownId(null);
  };

  // Handle print receipt
  const handlePrintReceipt = (booking) => {
    // if booking.payment === 'pending' then show warning and return
    if (booking.payment === 'pending' || !booking.payment) {
      toast.error("Cannot generate receipt for pending payments.");
      return;
    }

    generateReceipt(booking, calculateTotalPrice, getFormattedDate, getTimeRange, getServicePrice);
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
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

  if (!bookingsData || !bookingsData.bookings || bookingsData.bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bookings found for this date.

        {/* Service Selection Modal */}
        <ServiceSelectionModal
          showServiceModal={showServiceModal}
          selectedBarberForService={selectedBarberForService}
          setSelectedBarberForService={setSelectedBarberForService}
          availableBarbers={availableBarbers}
          serviceSearchQuery={serviceSearchQuery}
          setServiceSearchQuery={setServiceSearchQuery}
          shopDetails={shopDetails}
          selectedServices={selectedServices}
          toggleServiceSelection={toggleServiceSelection}
          onCancel={() => {
            setShowServiceModal(false);
            setSelectedBarberForService('');
            setSelectedServices([]);
            setServiceSearchQuery('');
          }}
          onDone={showNewBillingModal ? handleAddServicesToNewBill : handleDoneAddingServices}
        />

        {/* New Billing Modal */}
        {showNewBillingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Generate New Bill</h3>
                <button
                  onClick={handleCloseNewBilling}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-600"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Customer Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newBillCustomer.name}
                    onChange={(e) => setNewBillCustomer({ ...newBillCustomer, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newBillCustomer.phone}
                    onChange={(e) => setNewBillCustomer({ ...newBillCustomer, phone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h4>

                {/* Service Providers */}
                {newBillServiceProviders.map((provider, providerIndex) => {
                  const barber = availableBarbers.find(b => b._id === provider.barber_id);
                  const barberName = barber?.name || 'Unknown';
                  const barberGender = barber?.gender || 'Male';
                  const barberLabel = barberGender === 'Male' ? 'Barber' : 'Beautician';

                  return (
                    <div key={providerIndex} className="mb-3 last:mb-0 relative">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-semibold text-blue-700">
                          {barberLabel}: {barberName}
                        </div>
                        <button
                          onClick={() => handleDeleteProviderFromNewBill(providerIndex)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete this service provider"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      {provider.services.map((service, serviceIndex) => {
                        const price = getServicePrice(service, provider.barber_id);
                        return (
                          <div key={serviceIndex} className="flex justify-between text-sm text-gray-600 mb-1 ml-3">
                            <span>{service}:</span>
                            <span>₹ {price}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Add More Button */}
                <button
                  onClick={handleAddMoreForNewBill}
                  className="mt-2 flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  <span className="text-lg">+</span> Add more
                </button>

                {/* Subtotal */}
                <div className="flex justify-between text-sm text-gray-600 mb-2 pt-2 border-t border-gray-200 mt-2">
                  <span>Subtotal:</span>
                  <span>₹ {calculateNewBillTotal().subtotal}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>Discount:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newBillDiscount}
                      onChange={(e) => setNewBillDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                      placeholder="0"
                    />
                    <span>% (₹{calculateNewBillTotal().discountAmount.toFixed(2)})</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-300">
                  <span>Total Price:</span>
                  <span>₹ {calculateNewBillTotal().total.toFixed(2)}</span>
                </div>
              </div>

              {/* Generate Bill Button */}
              <button
                onClick={handleGenerateNewBill}
                disabled={generatingNewBill}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                ✓ Generate Bill
              </button>
            </div>
          </div>
        )}

        {/* Floating Generate Bill Button */}
        <button
          onClick={handleOpenNewBilling}
          className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-600 transition-all hover:shadow-xl flex items-center gap-2 font-medium z-40"
        >
          <span className="text-xl">+</span> Generate Bill
        </button>
      </div>

    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-4 flex flex-col justify-center items-center">
      {/* Search Bar */}
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search by customer name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Payment Filter Tabs */}
      <div className="bg-white rounded-lg border p-1 inline-flex">
        <button
          onClick={() => handleFilterChange('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${paymentFilter === 'pending'
            ? 'bg-orange-100 text-orange-800 border border-orange-200'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
        >
          Pending ({bookingsData.bookings.filter(b => (b.payment || 'pending') === 'pending').length})
        </button>
        <button
          onClick={() => handleFilterChange('paid')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${paymentFilter === 'paid'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
        >
          Paid ({bookingsData.bookings.filter(b => (b.payment || 'pending') === 'completed' || (b.payment || 'pending') === 'paid').length})
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${paymentFilter === 'all'
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
        >
          All ({bookingsData.bookings.length})
        </button>
      </div>

      {/* Show message if no bookings match filter */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery.trim()
            ? `No bookings found matching "${searchQuery}"`
            : `No ${paymentFilter === 'all' ? '' : paymentFilter} bookings found.`
          }
        </div>
      ) : (
        filteredBookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-start justify-between">
              {/* Customer Info */}
              <div className="flex items-center gap-3 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {editingBookingId === booking._id ? (
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-8 h-8 text-xs text-center bg-purple-400 rounded-full border-none outline-none text-white placeholder-purple-200"
                      placeholder="Name"
                    />
                  ) : (
                    booking.customerdetails?.customer_name.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                {/* Customer Details */}
                <div className="flex-1">
                  {/* Customer Name */}
                  {editingBookingId === booking._id ? (
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="text-lg font-semibold text-gray-800 mb-1 border border-gray-300 rounded px-2 py-1 w-full max-w-[200px]"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{booking.customerdetails?.customer_name}</h3>
                  )}

                  {/* Customer Phone */}
                  {editingBookingId === booking._id ? (
                    <input
                      type="text"
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="text-gray-600 mb-3 border border-gray-300 rounded px-2 py-1 w-full max-w-[200px]"
                    />
                  ) : (
                    <p className="text-gray-600 mb-3">{booking.customerdetails?.customer_phone}</p>
                  )}

                  {/* Booking Info Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {getFormattedDate(booking.date)}
                    </span>
                    <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {booking?.status}
                    </span>
                    {editingBookingId !== booking._id && (
                      <span className={`bg-orange-100 ${booking.payment === "pending" ? "text-orange-800" : "text-green-800"} px-3 py-1 rounded-full text-sm font-medium`}>
                        Payment: {booking.payment || 'pending'}
                      </span>
                    )}
                  </div>


                  {/* Price Breakdown */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Breakdown</h4>

                    {/* Service Prices grouped by Barber */}
                    {editingBookingId === booking._id ? (
                      // Edit mode: show edited service providers
                      editedServiceProviders.map((provider, providerIndex) => {
                        const barberName = provider.barber_id?.name || 'Unknown';
                        const barberGender = provider.barber_id?.gender || 'Male';
                        const barberLabel = barberGender === 'Male' ? 'Barber' : 'Beautician';

                        return (
                          <div key={providerIndex} className="mb-3 last:mb-0 relative">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-sm font-semibold text-blue-700">
                                {barberLabel}: {barberName}
                              </div>
                              <button
                                onClick={() => handleDeleteProvider(providerIndex)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Delete this service provider"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                            {provider.services.map((service, serviceIndex) => {
                              const price = getServicePrice(service, provider.barber_id._id || provider.barber_id);
                              return (
                                <div key={serviceIndex} className="flex justify-between text-sm text-gray-600 mb-1 ml-3">
                                  <span>{service}:</span>
                                  <span>₹ {price}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    ) : (
                      // View mode: show booking service providers
                      booking.serviceProviders && booking.serviceProviders.length > 0 ? (
                        booking.serviceProviders.map((provider, providerIndex) => {
                          const barberName = provider.barber_id?.name || 'Unknown';
                          const barberGender = provider.barber_id?.gender || 'Male';
                          const barberLabel = barberGender === 'Male' ? 'Barber' : 'Beautician';
                          const bookingStartTime = provider.start_time;
                          const bookingEndTime = provider.end_time;


                          return (
                            <div key={providerIndex} className="mb-3 last:mb-0">
                              <div className="text-sm font-semibold text-blue-700 mb-1">
                                {barberLabel}: {barberName}
                                <span>
                                  {bookingStartTime && bookingEndTime && (
                                    <span className="text-sm text-red-800 ml-2">
                                      {bookingStartTime} - {bookingEndTime}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {provider.services.map((service, serviceIndex) => {
                                const price = getServicePrice(service, provider.barber_id._id || provider.barber_id);
                                return (
                                  <div key={serviceIndex} className="flex justify-between text-sm text-gray-600 mb-1 ml-3">
                                    <span>{service}:</span>
                                    <span>₹ {price}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback for old structure
                        booking.services?.map((service, index) => {
                          const price = getServicePrice(service, booking.barber_id._id);
                          return (
                            <div key={index} className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>{service}:</span>
                              <span>₹ {price}</span>
                            </div>
                          );
                        })
                      )
                    )}

                    {/* Add More Button (only in edit mode) */}
                    {editingBookingId === booking._id && (
                      <button
                        onClick={handleAddMore}
                        className="mt-2 flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <span className="text-lg">+</span> Add more
                      </button>
                    )}

                    {/* Subtotal */}
                    <div className="flex justify-between text-sm text-gray-600 mb-2 pt-1 border-t border-gray-200 mt-2">
                      <span>Subtotal:</span>
                      <span>₹ {editingBookingId === booking._id ? calculateTotalPrice(booking, editedServiceProviders).subtotal : calculateTotalPrice(booking).subtotal}</span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Discount:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discounts[booking._id] || booking.discount_applied || 0}
                          onChange={(e) => handleDiscountChange(booking._id, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                          placeholder="0"
                          disabled={editingBookingId !== booking._id}
                        />
                        <span>% (₹{editingBookingId === booking._id ? calculateTotalPrice(booking, editedServiceProviders).discountAmount.toFixed(2) : calculateTotalPrice(booking).discountAmount.toFixed(2)})</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-300">
                      <span>Total Price:</span>
                      <span>₹ {editingBookingId === booking._id ? calculateTotalPrice(booking, editedServiceProviders).total.toFixed(2) : calculateTotalPrice(booking).total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {editingBookingId === booking._id && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                      {/* Payment Status Edit */}
                      <select
                        value={editForm.paymentStatus}
                        onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                        className={`px-3 py-1 rounded-full text-sm border border-gray-300 ${editForm.paymentStatus === 'paid'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-orange-50 text-orange-800'
                          }`}
                      >
                        <option value="pending">Payment: pending</option>
                        <option value="paid">Payment: paid</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Edit/Save/Cancel Buttons */}
                {editingBookingId === booking._id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSaveEdit(booking._id)}
                      className="p-2 hover:bg-green-100 rounded-full transition-colors text-green-600"
                      title="Save changes"
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600"
                      title="Cancel edit"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(booking)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                      title="Edit booking"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handlePrintReceipt(booking)}
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                      title="Print receipt"
                    >
                      <FiPrinter size={16} />
                    </button>
                  </>
                )}

                {/* Dropdown Menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown(booking._id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <CiMenuKebab />
                  </button>

                  {openDropdownId === booking._id && !editingBookingId && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                      <button
                        onClick={() => handleCancelBooking(booking._id, booking.payment)}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Cancel Booking
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(booking)}
                        className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FiPrinter size={14} />
                        Print Receipt
                      </button>
                      {booking && booking.status === 'booked' && (
                        <button
                          onClick={() => {
                            updateBookingStatus({ id: booking._id, status: 'arrived' })
                            setOpenDropdownId(null);
                          }}

                          className="w-full text-left px-3 py-2 text-sm text-green-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                        >
                          🚶 Arrived
                        </button>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Service Selection Modal */}
      <ServiceSelectionModal
        showServiceModal={showServiceModal}
        selectedBarberForService={selectedBarberForService}
        setSelectedBarberForService={setSelectedBarberForService}
        availableBarbers={availableBarbers}
        serviceSearchQuery={serviceSearchQuery}
        setServiceSearchQuery={setServiceSearchQuery}
        shopDetails={shopDetails}
        selectedServices={selectedServices}
        toggleServiceSelection={toggleServiceSelection}
        onCancel={() => {
          setShowServiceModal(false);
          setSelectedBarberForService('');
          setSelectedServices([]);
          setServiceSearchQuery('');
        }}
        onDone={showNewBillingModal ? handleAddServicesToNewBill : handleDoneAddingServices}
      />

      {/* New Billing Modal */}
      {showNewBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Generate New Bill</h3>
              <button
                onClick={handleCloseNewBilling}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-600"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Customer Details */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newBillCustomer.name}
                  onChange={(e) => setNewBillCustomer({ ...newBillCustomer, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newBillCustomer.phone}
                  onChange={(e) => setNewBillCustomer({ ...newBillCustomer, phone: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h4>

              {/* Service Providers */}
              {newBillServiceProviders.map((provider, providerIndex) => {
                const barber = availableBarbers.find(b => b._id === provider.barber_id);
                const barberName = barber?.name || 'Unknown';
                const barberGender = barber?.gender || 'Male';
                const barberLabel = barberGender === 'Male' ? 'Barber' : 'Beautician';

                return (
                  <div key={providerIndex} className="mb-3 last:mb-0 relative">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-semibold text-blue-700">
                        {barberLabel}: {barberName}
                      </div>
                      <button
                        onClick={() => handleDeleteProviderFromNewBill(providerIndex)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete this service provider"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    {provider.services.map((service, serviceIndex) => {
                      const price = getServicePrice(service, provider.barber_id);
                      return (
                        <div key={serviceIndex} className="flex justify-between text-sm text-gray-600 mb-1 ml-3">
                          <span>{service}:</span>
                          <span>₹ {price}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Add More Button */}
              <button
                onClick={handleAddMoreForNewBill}
                className="mt-2 flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                <span className="text-lg">+</span> Add more
              </button>

              {/* Subtotal */}
              <div className="flex justify-between text-sm text-gray-600 mb-2 pt-2 border-t border-gray-200 mt-2">
                <span>Subtotal:</span>
                <span>₹ {calculateNewBillTotal().subtotal}</span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Discount:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBillDiscount}
                    onChange={(e) => setNewBillDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                    placeholder="0"
                  />
                  <span>% (₹{calculateNewBillTotal().discountAmount.toFixed(2)})</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-300">
                <span>Total Price:</span>
                <span>₹ {calculateNewBillTotal().total.toFixed(2)}</span>
              </div>
            </div>

            {/* Generate Bill Button */}
            <button
              onClick={handleGenerateNewBill}
              disabled={generatingNewBill}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              ✓ Generate Bill
            </button>
          </div>
        </div>
      )}

      {/* Floating Generate Bill Button */}
      <button
        onClick={handleOpenNewBilling}
        className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-600 transition-all hover:shadow-xl flex items-center gap-2 font-medium z-40"
      >
        <span className="text-xl">+</span> Generate Bill
      </button>

      {/* Pagination */}
      {bookingsData.pagination && (
        <Pagination
          pagination={bookingsData.pagination}
          currentPage={currentPage}
          onPageChange={onPageChange}
          totalLabel="bookings"
        />
      )}
    </div>
  );
};

export default CustomerBookings;