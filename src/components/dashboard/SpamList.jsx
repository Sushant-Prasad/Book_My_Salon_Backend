import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { server } from '../../constants/config'
import toast from 'react-hot-toast'
import { getTokenFromStorage } from '../../utils/features'
import Pagination from './Pagination'
import { useAddToSpamListMutation, useRemoveFromSpamListMutation } from '../../redux/api/api'

const SpamList = () => {
  const [spamList, setSpamList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_entries: 0
  })
  const [currentPage, setCurrentPage] = useState(1);
  // RTK Query hooks
   const [addToSpamList] = useAddToSpamListMutation();
  const [removeFromSpamList] = useRemoveFromSpamListMutation();

  useEffect(() => {
    fetchSpamList(currentPage)
  }, [currentPage])

  const fetchSpamList = async (page = 1) => {
    try {
      setLoading(true)
      const response = await axios.get(`${server}/api/v1/shop/spam-list`, {
        params: {
          page: page,
          limit: 10,
          search: searchTerm || undefined
        },
        headers: {
          "authorization": `Bearer ${getTokenFromStorage()}`
        },
        withCredentials: true,
      })
      setSpamList(response.data.data.spam_list || [])
      setPagination(response.data.data.pagination || { current_page: 1, total_pages: 0, total_entries: 0 })
    } catch (error) {
      // console.error('Error fetching spam list:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch spam list')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleSearch = async () => {
    setCurrentPage(1) // Reset to first page when searching
    fetchSpamList(1)
  }

  const removingFromSpamList = async (customerId) => {
    try {
      await removeFromSpamList(customerId).unwrap();
      
      // Refresh the current page after removal
      fetchSpamList(currentPage)
      toast.success('Customer removed from spam list')
    } catch (error) {
      // console.error('Error removing from spam list:', error)
      toast.error(error.response?.data?.message || 'Failed to remove customer from spam list')
    }
  }

  const addingToSpamList = async (phone, reason) => {
    try {
      await addToSpamList({ phone, reason }).unwrap();
      
      fetchSpamList(currentPage) // Refresh the current page
      toast.success('Customer added to spam list')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add customer to spam list')
    }
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

  const SpamSkeleton = () => (
    <div className="bg-[#D4DAFF] rounded-lg p-4 animate-pulse">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        </div>
        <div className="w-20 h-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  )

  const AddSpamForm = ({ onAdd, onCancel }) => {
    const [phone, setPhone] = useState('')
    const [reason, setReason] = useState('')

    const handleSubmit = (e) => {
      e.preventDefault()
      if (!phone.trim() || !reason.trim()) {
        toast.error('Please fill all fields')
        return
      }
      onAdd(phone, reason)
      setPhone('')
      setReason('')
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Add Customer to Spam List</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
                placeholder="Enter customer phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
                placeholder="Reason for adding to spam list"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#645CAD] text-white py-2 px-4 rounded-lg hover:bg-[#574ba0] transition-colors"
              >
                Add to Spam
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Spam Customer List</h2>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#645CAD] text-white px-4 py-2 rounded-lg hover:bg-[#574ba0] transition-colors"
        >
          Add to Spam List
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#645CAD] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="bg-[#645CAD] text-white px-6 py-3 rounded-lg hover:bg-[#574ba0] transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Spam List */}
      <div className="space-y-4">
        {loading ? (
          <>
            <SpamSkeleton />
            <SpamSkeleton />
            <SpamSkeleton />
          </>
        ) : spamList.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">
              {searchTerm ? 'No matching customers found' : 'No spam customers found'}
            </div>
            <p className="text-gray-400 mt-2">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Customers added to spam list will appear here'
              }
            </p>
          </div>
        ) : (
          spamList.map((item) => (
            <div key={item._id} className="bg-[#D4DAFF] rounded-lg p-4 shadow-sm">
              <div className="flex gap-4 items-center">
                {/* Customer Profile */}
                <div className="shrink-0">
                  {item.customer_id?.profileUrl ? (
                    <img 
                      src={item.customer_id.profileUrl} 
                      alt={item.customer_id?.name || 'Customer'} 
                      loading="lazy"
                      className="w-12 h-12 rounded-full border-2 border-red-500 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center text-white font-semibold">
                      {item.customer_id?.name ? item.customer_id.name.charAt(0).toUpperCase() : 
                       item.customer_name ? item.customer_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}
                </div>

                {/* Customer Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">
                    {item.customer_id?.name || item.customer_name || 'Unknown Customer'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.customer_id?.phone || item.customer_phone || 'No phone'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.customer_id?.email || item.customer_email || 'No email'}
                  </p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-sm text-gray-600">{item.reason}</p>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Blocked on: {getDate(item.blocked_date || item.created_at)}</div>
                    {item.blocked_date !== item.created_at && (
                      <div>Added on: {getDate(item.created_at)}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <button
                    onClick={() => removingFromSpamList(item.customer_id?._id || item._id)}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Remove
                  </button>
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
        totalLabel="total entries"
      />

      {/* Add Spam Form Modal */}
      {showAddForm && (
        <AddSpamForm 
          onAdd={addingToSpamList}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

export default SpamList