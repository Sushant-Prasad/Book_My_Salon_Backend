import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  useGetQuarterlyRevenueQuery,
  useGetBarberMonthlyRevenueQuery
} from '../../redux/api/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ShopDashboard = () => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2);

  // Redux hooks
  const { data: monthlyRevenueData, isLoading: monthlyLoading, error: monthlyError } = useGetQuarterlyRevenueQuery();
  const { data: barberRevenueData, isLoading: barberLoading, error: barberError } = useGetBarberMonthlyRevenueQuery();

  // Extract data from Redux responses
  const monthlyRevenue = monthlyRevenueData?.data || { months: [], revenue: [] };
  const barberRevenue = barberRevenueData?.data || [];
  
  const loading = monthlyLoading || barberLoading;
  const error = monthlyError || barberError;

  // Monthly revenue chart configuration
  const monthlyChartData = {
    labels: monthlyRevenue.months,
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: monthlyRevenue.revenue,
        backgroundColor: '#79aeff',
        borderColor: '#458cf7',
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 40
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Last 3 Months Revenue',
        font: { size: window.innerWidth < 640 ? 14 : 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        grid: {
          display: false,
        }
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        grid: {
          display: false,
        }
      }
    }
  };

  // Barber revenue chart configuration for current month
  const getCurrentMonthBarberData = () => {
    if (!barberRevenue.length || currentMonthIndex >= barberRevenue.length) {
      return { labels: [], datasets: [] };
    }

    const currentMonth = barberRevenue[currentMonthIndex];
    
    // Generate colors for each barber
    const colors = [
      'rgba(239, 68, 68, 0.6)',
      'rgba(34, 197, 94, 0.6)', 
      'rgba(168, 85, 247, 0.6)',
      'rgba(245, 158, 11, 0.6)',
      'rgba(236, 72, 153, 0.6)',
      'rgba(59, 130, 246, 0.6)',
      'rgba(249, 115, 22, 0.6)',
      'rgba(139, 69, 19, 0.6)',
      'rgba(75, 85, 99, 0.6)',
      'rgba(16, 185, 129, 0.6)',
      'rgba(168, 162, 158, 0.6)',
      'rgba(192, 38, 211, 0.6)',
      'rgba(245, 101, 101, 0.6)',
      'rgba(52, 211, 153, 0.6)',
      'rgba(251, 191, 36, 0.6)'
    ];

    const barberNames = currentMonth.barbers.map(barber => barber.barberName);
    const barberRevenues = currentMonth.barbers.map(barber => barber.totalRevenue);

    return {
      labels: barberNames,
      datasets: [
        {
          label: 'Revenue (₹)',
          data: barberRevenues,
          backgroundColor: colors.slice(0, barberNames.length),
          borderColor: colors.slice(0, barberNames.length).map(color => color.replace('0.3', '1')),
          borderWidth: 2,
          borderRadius: 4,
          barThickness: 35
        }
      ]
    };
  };

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonthIndex(prev => Math.min(barberRevenue.length - 1, prev + 1));
  };

  const barberChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we have many barbers
      },
      title: {
        display: true,
        text: barberRevenue.length > 0 && currentMonthIndex < barberRevenue.length 
          ? `${barberRevenue[currentMonthIndex]?.month} ${barberRevenue[currentMonthIndex]?.year} - Barber Performance`
          : 'Barber Performance',
        font: { size: window.innerWidth < 640 ? 14 : 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        grid: {
          display: false,
        }
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 8 : 10
          }
        },
        grid: {
          display: false,
        }
      }
      
    },
    indexAxis: barberRevenue.length > 0 && barberRevenue[currentMonthIndex]?.barbers.length > 8 ? 'y' : 'x', // Horizontal bars for many barbers
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error?.message || error?.data?.message || 'Failed to fetch revenue data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Dashboard</h1>
          <p className="text-gray-600">Revenue analytics and performance insights</p>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {monthlyRevenue.revenue.map((revenue, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {monthlyRevenue.months[index]}
              </h3>
              <p className="text-3xl font-bold text-[#8818f6]">
                ₹{revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Monthly Revenue</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-1">
            <div className="h-64 sm:h-80 md:h-96">
              <Bar data={monthlyChartData} options={monthlyChartOptions} />
            </div>
          </div>

          {/* Barber Revenue Chart with Month Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={goToPreviousMonth}
                disabled={currentMonthIndex === 0}
                className="flex items-center px-3 py-2 sm:px-4 bg-[#bc6dfe] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#a63dff] transition-colors cursor-pointer text-sm sm:text-base"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {barberRevenue.length > 0 && currentMonthIndex < barberRevenue.length 
                    ? `${barberRevenue[currentMonthIndex]?.month} ${barberRevenue[currentMonthIndex]?.year}`
                    : 'Select Month'
                  }
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {barberRevenue.length > 0 && currentMonthIndex < barberRevenue.length 
                    ? `${barberRevenue[currentMonthIndex]?.barbers.length} Barbers`
                    : ''
                  }
                </p>
              </div>
              
              <button 
                onClick={goToNextMonth}
                disabled={currentMonthIndex >= barberRevenue.length - 1}
                className="flex items-center px-3 py-2 sm:px-4 bg-[#bc6dfe] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#a63dff] transition-colors cursor-pointer text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <svg className="w-4 h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Chart */}
            <div className="h-64 sm:h-80 md:h-96">
              <Bar data={getCurrentMonthBarberData()} options={barberChartOptions} />
            </div>
          </div>
        </div>

        {/* Barber Performance Table */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Barber Performance Details</h2>
          </div>
          <div className="overflow-x-auto">
            {barberRevenue.map((month, monthIndex) => (
              <div key={monthIndex} className="p-6 border-b last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">{month.month} {month.year}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {month.barbers.map((barber, barberIndex) => (
                    <div key={barberIndex} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{barber.barberName}</h4>
                      <p className="text-2xl font-bold text-green-600">₹{barber.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{barber.totalBookings} bookings</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;