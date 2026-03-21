import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { MdDelete } from 'react-icons/md'
import {
  useGetBarbersQuery,
  useGetAdminInfoQuery,
  useUpdateAdminShopInfoMutation,
  useRemoveBarberMutation
} from '../../redux/api/api'

const Shop = () => {
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminFormData, setAdminFormData] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    offlineDays: [],
    notice: ''
  })

  // Redux hooks
  const { data: barbersData, isLoading: barbersLoading } = useGetBarbersQuery()
  const { data: adminInfoData, isLoading: adminInfoLoading } = useGetAdminInfoQuery()
  const [updateAdminShopInfo, { isLoading: updateLoading }] = useUpdateAdminShopInfoMutation()
  const [removeBarber] = useRemoveBarberMutation()

  const barbers = barbersData?.data?.barbers || []
  const adminInfo = adminInfoData?.data || {
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    offlineDays: [],
    notice: ''
  }
  const loading = barbersLoading || adminInfoLoading

  // Initialize form data when admin info is loaded
  useEffect(() => {
    if (adminInfoData?.data && showAdminForm) {
      setAdminFormData(adminInfoData.data)
    }
  }, [adminInfoData, showAdminForm])

  // Handle barber removal
  const handleRemoveBarber = async (barberId, barberName) => {
    if (window.confirm(`Are you sure you want to remove ${barberName}?`)) {
      try {
        const result = await removeBarber(barberId).unwrap()
        toast.success(result.message || 'Barber removed successfully')
      } catch (error) {
        toast.error(error.message || "Failed to remove barber")
      }
    }
  }

  // Handle admin info form submission
  const handleAdminInfoSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const result = await updateAdminShopInfo(adminFormData).unwrap()
      toast.success(result.message || 'Shop details updated successfully')
      setShowAdminForm(false)
    } catch (error) {
      toast.error(error.message || "Failed to update admin info")
    }
  }

  // Handle input changes for admin form
  const handleAdminInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'offlineDays') {
      const day = value
      setAdminFormData(prev => ({
        ...prev,
        offlineDays: checked 
          ? [...(prev.offlineDays || []), day]
          : (prev.offlineDays || []).filter(d => d !== day)
      }))
    } else {
      setAdminFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 w-full">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
        <p className="text-gray-600 mt-1">Manage shop information and barbers</p>
      </div>

      {/* Admin Info Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Shop Information</h2>
            <p className="text-gray-600 text-sm">Configure your shop details and settings</p>
          </div>
          <button
            onClick={() => {
              if (!showAdminForm) {
                setAdminFormData(adminInfo)
              }
              setShowAdminForm(!showAdminForm)
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
          >
            {showAdminForm ? 'Cancel' : 'Edit Info'}
          </button>
        </div>

        {!showAdminForm ? (
          // Display current admin info
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Shop Name</h3>
              <p className="text-gray-600">{adminInfo.shop_name || 'Not set'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Phone</h3>
              <p className="text-gray-600">{adminInfo.shop_phone || 'Not set'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Email</h3>
              <p className="text-gray-600">{adminInfo.shop_email || 'Not set'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Address</h3>
              <p className="text-gray-600">{adminInfo.shop_address || 'Not set'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900">Offline Days</h3>
              <p className="text-gray-600">
                {adminInfo.offlineDays?.length > 0 ? adminInfo.offlineDays.join(', ') : 'None'}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900">Notice</h3>
              <p className="text-gray-600">{adminInfo.notice || 'No notice'}</p>
            </div>
          </div>
        ) : (
          // Admin info form
          <form onSubmit={handleAdminInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  name="shop_name"
                  value={adminFormData.shop_name}
                  onChange={handleAdminInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="shop_phone"
                  value={adminFormData.shop_phone}
                  onChange={handleAdminInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="shop_email"
                  value={adminFormData.shop_email}
                  onChange={handleAdminInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="shop_address"
                  value={adminFormData.shop_address}
                  onChange={handleAdminInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offline Days
              </label>
              <div className="flex flex-wrap gap-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      name="offlineDays"
                      value={day}
                      checked={adminFormData.offlineDays?.includes(day) || false}
                      onChange={handleAdminInputChange}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notice
              </label>
              <textarea
                name="notice"
                value={adminFormData.notice}
                onChange={handleAdminInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any special notice or announcement..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
              >
                {updateLoading ? 'Saving...' : 'Save Information'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdminForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Barbers Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Barbers Management</h2>
      </div>
      
      <div className="flex flex-col gap-6">
        {barbers.map((barberData) => {
          const barber = barberData.barber_id; // Extract barber details from nested object
          
          return (
            <div key={barber._id} className="bg-[#ffffff] rounded-lg shadow-sm relative">
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveBarber(barber._id, barber.name)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors duration-200"
                title={`Remove ${barber.name}`}
              >
                <MdDelete />
              </button>

              <div className="p-6">
                {/* Barber Info */}
                <div className="flex items-center space-x-4">
                  <img
                    src={barber.profileUrl || '/default-avatar.png'}
                    alt={barber.name}
                    className="w-16 h-16 rounded-full border-3 border-purple-200 object-cover"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png'
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{barber.name}</h3>
                    <p className="text-sm text-purple-600">Professional {barber.gender === "Male" ? "Barber" : "Beautician"}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 ml-20">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                    <span className="text-sm text-gray-900 font-medium">{barber.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">{barber.email}</span>
                  </div>
                </div>

                {/* Services */}
                <div>
                  {barberData.services && barberData.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2 space-y-2">
                      {barberData.services.map((service, index) => (
                        <div 
                          key={service._id || index} 
                          className="text-xs flex gap-2 w-fit bg-[#dbeafe] text-gray-700 px-2 py-1 rounded mb-2"
                        >
                          <div className="flex items-center space-x-2 ">
                            <div className={`w-1 h-1 rounded-full ${service.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-gray-900">{service.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-purple-600">₹{service.price}</div>
                            {/* <div className="text-xs text-gray-500">{service.duration} min</div> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No services available</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {barbers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V6C15 7.66 13.66 9 12 9S9 7.66 9 6V5.5L3 7V9H21ZM3 17V19H9V17.5C9 16.12 10.12 15 11.5 15S14 16.12 14 17.5V19H21V17H14.5H9.5H3Z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Barbers Found</h3>
          <p className="text-gray-500">No barbers are currently registered in the system.</p>
        </div>
      )}
    </div>
  )
}

export default Shop