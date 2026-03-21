import React from 'react'

const Pagination = ({ 
  pagination, 
  currentPage, 
  onPageChange, 
  totalLabel = "total entries" 
}) => {
  if (!pagination || pagination.total_pages <= 1) {
    return null
  }

  return (
    <div className="mt-6 flex justify-center items-center gap-4">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#A89FFB] text-white hover:bg-[#988bf7]'
          }`}
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => {
            // Show page numbers with ellipsis for large page counts
            if (pagination.total_pages <= 7) {
              // Show all pages if 7 or fewer
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#645CAD] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              )
            } else {
              // Show condensed pagination for more than 7 pages
              if (
                page === 1 ||
                page === pagination.total_pages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#645CAD] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 py-2 text-gray-400">
                    ...
                  </span>
                )
              }
              return null
            }
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pagination.total_pages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === pagination.total_pages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#A89FFB] text-white hover:bg-[#988bf7]'
          }`}
        >
          Next
        </button>
      </div>

      {/* Page Info */}
      <div className="text-sm text-gray-600 ml-4">
        Page {pagination.current_page} of {pagination.total_pages} 
        <span className="text-gray-400 ml-2">
          ({pagination.total_bookings || pagination.total_entries || 0} {totalLabel})
        </span>
      </div>
    </div>
  )
}

export default Pagination