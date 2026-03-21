import React, { useState, useEffect } from 'react'
import { useGetMyShopDetailsQuery, useUpdateShopDetailsMutation } from '../../redux/api/api'
import toast from 'react-hot-toast'
import { FaCamera } from 'react-icons/fa'
import { MdDelete } from "react-icons/md";

const ShopEdit = () => {
  const [shopDetails, setShopDetails] = useState({
    profileUrl: '',
    shop_address: '',
    phone: '',
    opening_hours: { start: '10:00', end: '21:00' },
    tiffin_time: { start: '14:00', end: '15:00' },
    today_open: true,
    half_closing_day: '',
    services: [],
    slot_interval: 15,
    closing_days: []
  })
  const [saving, setSaving] = useState(false)
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState('')
  
  // RTK Query hooks
  const { data: shopData, isLoading: loading, error, refetch } = useGetMyShopDetailsQuery();
  const [updateShopDetails] = useUpdateShopDetailsMutation();

  // Form states for new service
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    duration: '',
    price: '',
    available: true
  })

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const slotIntervals = [5, 10, 15, 20, 30]

  // Handle RTK Query data
  useEffect(() => {
    if (shopData?.data) {
      const data = {
        ...shopData.data,
        profileUrl: {
          public_id: shopData.data.profileUrl?.public_id || '',
          url: shopData.data.profileUrl?.url || '',
        },
        opening_hours: shopData.data.opening_hours || { start: '10:00', end: '21:00' },
        tiffin_time: shopData.data.tiffin_time || { start: '14:00', end: '15:00' },
        services: shopData.data.services || [],
        closing_days: shopData.data.closing_days || []
      }
      
      setShopDetails(data)
      
      // Set profile picture preview from fetched data
      if (data.profileUrl?.url) {
        setProfilePicPreview(data.profileUrl.url)
      }
    }
  }, [shopData])

  // Handle RTK Query error state
  if (error) {
    // If it's a 404 error (shop details not found), show the create form instead of error
    if (error?.status === 404 || error?.data?.message?.includes('not found')) {
      // Continue to show the form for creating new shop details
      // Don't return error, let the form render normally
    } else {
      // Show error for other types of errors (500, network, etc.)
      return (
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading shop details</p>
              <p>{error?.data?.message || 'Failed to fetch shop details'}</p>
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
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setShopDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setShopDetails(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleClosingDayToggle = (day) => {
    setShopDetails(prev => ({
      ...prev,
      closing_days: prev.closing_days.includes(day)
        ? prev.closing_days.filter(d => d !== day)
        : [...prev.closing_days, day]
    }))
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddService = () => {
    if (!newService.name || !newService.duration || !newService.price) {
      toast.error('Please fill all service fields')
      return
    }

    const service = {
      name: newService.name,
      duration: parseInt(newService.duration),
      price: parseInt(newService.price),
      available: newService.available
    }

    setShopDetails(prev => ({
      ...prev,
      services: [...prev.services, service]
    }))

    setNewService({ name: '', duration: '', price: '', available: true })
    setShowServiceForm(false)
  }

  const handleRemoveService = (index) => {
    setShopDetails(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  const handleServiceToggle = (index) => {
    setShopDetails(prev => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, available: !service.available } : service
      )
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Create FormData for all shop details
      const formData = new FormData()
      
      // Add profile picture if selected
      if (profilePicFile) {
        formData.append('avatar', profilePicFile)
      }
      
      // Add shop details
      formData.append('shop_address', shopDetails.shop_address)
      formData.append('phone', shopDetails.phone)
      
      // Add opening hours
      formData.append('opening_hours[start]', shopDetails.opening_hours.start)
      formData.append('opening_hours[end]', shopDetails.opening_hours.end)
      
      // Add tiffin time
      formData.append('tiffin_time[start]', shopDetails.tiffin_time.start)
      formData.append('tiffin_time[end]', shopDetails.tiffin_time.end)
      
      // Add other fields
      formData.append('today_open', shopDetails.today_open)
      // if half_closing_day is empty, send as empty string
      formData.append('half_closing_day', shopDetails.half_closing_day || "")
      formData.append('slot_interval', shopDetails.slot_interval)
      
      // Add closing days
      shopDetails.closing_days.forEach((day, index) => {
        formData.append(`closing_days[${index}]`, day)
      })
      
      // Add services
      shopDetails.services.forEach((service, index) => {
        formData.append(`services[${index}][name]`, service.name)
        formData.append(`services[${index}][duration]`, service.duration)
        formData.append(`services[${index}][price]`, service.price)
        formData.append(`services[${index}][available]`, service.available)
      })

      await updateShopDetails(formData).unwrap();

      toast.success('Shop details updated successfully')
      setProfilePicFile(null)
      
      // Refresh shop details from server to get updated profile URL
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update shop details')
    } finally {
      setSaving(false)
    }
  }

  const ShopSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return <ShopSkeleton />
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Shop Settings</h2>

      <div className="space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-[#D4DAFF] rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Profile Picture</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profilePicPreview || '/default-avatar.png'}
                alt="Profile"
                loading="lazy"
                className="w-20 h-20 rounded-full border-2 border-[#645CAD] object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-[#645CAD] text-black p-2 rounded-full cursor-pointer hover:bg-[#574ba0] transition-colors">
                <span className="text-xs"><FaCamera /></span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-600">Click the camera icon to update your profile picture</p>
              {profilePicFile && (
                <p className="text-xs text-green-600 mt-1">New image selected</p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Address</label>
            <textarea
              value={shopDetails.shop_address}
              onChange={(e) => handleInputChange('shop_address', e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              placeholder="Enter shop address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={shopDetails.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-[#D4DAFF] rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Opening Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={shopDetails.opening_hours.start}
                onChange={(e) => handleInputChange('opening_hours.start', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={shopDetails.opening_hours.end}
                onChange={(e) => handleInputChange('opening_hours.end', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shopDetails.today_open}
                  onChange={(e) => handleInputChange('today_open', e.target.checked)}
                  className="w-5 h-5 text-[#645CAD] bg-gray-100 border-gray-300 rounded focus:ring-[#645CAD] focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Open Today</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tiffin Time */}
        <div className="bg-[#D4DAFF] rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Tiffin Time (Break)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={shopDetails.tiffin_time.start}
                onChange={(e) => handleInputChange('tiffin_time.start', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={shopDetails.tiffin_time.end}
                onChange={(e) => handleInputChange('tiffin_time.end', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Half Closing Day and Slot Interval */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Half Closing Day</label>
            <select
              value={shopDetails.half_closing_day || ""}
              onChange={(e) => handleInputChange('half_closing_day', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
            >
              <option value="">No half closing day</option>
              {weekdays.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slot Interval (minutes)</label>
            <select
              value={shopDetails.slot_interval}
              onChange={(e) => handleInputChange('slot_interval', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
            >
              {slotIntervals.map(interval => (
                <option key={interval} value={interval}>{interval} minutes</option>
              ))}
            </select>
          </div>
        </div>

        {/* Closing Days */}
        <div className="bg-[#D4DAFF] rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Closing Days</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {weekdays.map(day => (
              <label key={day} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shopDetails.closing_days.includes(day)}
                  onChange={() => handleClosingDayToggle(day)}
                  className="w-5 h-5 text-[#645CAD] bg-gray-100 border-gray-300 rounded focus:ring-[#645CAD] focus:ring-2"
                />
                <span className="text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-[#D4DAFF] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Services</h3>
            <button
              onClick={() => setShowServiceForm(true)}
              className="bg-[#645CAD] text-white px-4 py-2 rounded-lg hover:bg-[#574ba0] transition-colors"
            >
              Add Service
            </button>
          </div>

          <div className="space-y-3">
            {shopDetails.services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.duration} min • ₹{service.price}</p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={service.available}
                      onChange={() => handleServiceToggle(index)}
                      className="w-4 h-4 text-[#645CAD] bg-gray-100 border-gray-300 rounded focus:ring-[#645CAD] focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">Available</span>
                  </label>

                  <button
                    onClick={() => handleRemoveService(index)}
                    className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Service Form */}
          {showServiceForm && (
            <div className="mt-4 bg-white rounded-lg p-4 border-2 border-[#645CAD]">
              <h4 className="font-medium text-gray-800 mb-3">Add New Service</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Service name"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
                />

                <input
                  type="number"
                  value={newService.duration}
                  onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Duration (min)"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
                />

                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Price (₹)"
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowServiceForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  className="px-4 py-2 bg-[#645CAD] text-white rounded-lg hover:bg-[#574ba0] transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#645CAD] text-white px-8 py-3 rounded-lg hover:bg-[#574ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShopEdit