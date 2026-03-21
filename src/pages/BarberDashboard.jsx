import React, { useState } from 'react'
import CustomerBookings from '../components/dashboard/CustomerBookings'
import SpamList from '../components/dashboard/SpamList'
import ShopEdit from '../components/dashboard/ShopEdit'

const BarberDashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings')

  const tabs = [
    { id: 'bookings', name: 'Customer Bookings', icon: '📅' },
    { id: 'spam', name: 'Spam List', icon: '🚫' },
    { id: 'shop', name: 'Shop Settings', icon: '⚙️' }
  ]

  const renderContent = () => {
    switch(activeTab) {
      case 'bookings':
        return <CustomerBookings />
      case 'spam':
        return <SpamList />
      case 'shop':
        return <ShopEdit />
      default:
        return <CustomerBookings />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#D4DAFF] text-center rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Barber Dashboard</h1>
          <p className="text-gray-600">Manage your bookings, customers, and shop settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#645CAD] border-b-2 border-[#645CAD] bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default BarberDashboard