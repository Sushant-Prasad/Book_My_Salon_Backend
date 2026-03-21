import React from 'react';

const ServiceSelectionModal = ({
  showServiceModal,
  selectedBarberForService,
  setSelectedBarberForService,
  availableBarbers,
  serviceSearchQuery,
  setServiceSearchQuery,
  shopDetails,
  selectedServices,
  toggleServiceSelection,
  onCancel,
  onDone
}) => {
  if (!showServiceModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Add Services</h3>

        {/* Barber Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Barber/Beautician
          </label>
          <select
            value={selectedBarberForService}
            onChange={(e) => setSelectedBarberForService(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select Barber --</option>
            {availableBarbers.map((barber) => (
              <option key={barber._id} value={barber._id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>

        {/* Services Section */}
        {selectedBarberForService && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Services:</h4>

            {/* Service Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                const shop = shopDetails.find(s => s.barber_id === selectedBarberForService);
                if (!shop || !shop.services) return <p className="text-sm text-gray-500">No services available</p>;

                // Filter services based on search query
                const filteredServices = serviceSearchQuery.trim()
                  ? shop.services.filter(service =>
                    service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                  )
                  : shop.services;

                if (filteredServices.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {serviceSearchQuery.trim()
                        ? `No services found matching "${serviceSearchQuery}"`
                        : 'No services available'}
                    </p>
                  );
                }

                return filteredServices.map((service, index) => (
                  <label
                    key={service._id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedServices.includes(service.name)
                      ? 'bg-purple-100 border-purple-400'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.name)}
                        onChange={() => toggleServiceSelection(service.name)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="font-medium text-sm">{index + 1}. {service.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{service.duration} min</div>
                      <div className="text-sm text-gray-500">₹{service.price}</div>
                    </div>
                  </label>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onDone}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelectionModal;
