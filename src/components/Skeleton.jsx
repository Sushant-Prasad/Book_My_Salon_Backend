import React from 'react';

// Base Skeleton Component
export const Skeleton = ({ className = "", width = "100%", height = "20px", ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-300 rounded ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
};

// Booking Card Skeleton
export const BookingSkeleton = () => {
  return (
    <div className="flex gap-4 bg-white rounded-lg p-4 shadow mb-4">
      <div className="w-12">
        <Skeleton className="rounded-full w-10 h-10" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton width="80px" height="24px" className="rounded-full" />
          <Skeleton width="60px" height="24px" className="rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton width="120px" height="20px" className="rounded-full" />
          <Skeleton width="80px" height="20px" className="rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Barber Selection Skeleton
export const BarberSkeleton = () => {
  return (
    <div className="flex flex-col w-fit gap-2 opacity-50">
      <Skeleton className="rounded-full border-2 w-12 h-12" />
      <Skeleton height="4px" className="rounded" />
      <Skeleton width="60px" height="12px" />
    </div>
  );
};

// Time Slot Skeleton
export const TimeSlotSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {[...Array(8)].map((_, index) => (
        <Skeleton 
          key={index}
          width="70px" 
          height="28px" 
          className="rounded-full"
        />
      ))}
    </div>
  );
};

// Team Card Skeleton
export const TeamSkeleton = () => {
  return (
    <div className="flex flex-col items-center min-w-[120px] bg-white rounded-lg p-4 shadow">
      <Skeleton className="w-20 h-20 rounded-full mb-2" />
      <Skeleton width="80px" height="16px" className="mb-1" />
      <Skeleton width="100px" height="14px" />
    </div>
  );
};

// Service Card Skeleton
export const ServiceSkeleton = () => {
  return (
    <div className="relative bg-[#b8a4ff] rounded-xl shadow-sm overflow-hidden w-[calc(50%-8px)] min-w-[194px]">
      <div className="relative h-32 overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-3 right-3 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm">
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
      <div className="p-4">
        <Skeleton width="120px" height="16px" className="mb-2 mx-auto" />
        <Skeleton width="100%" height="12px" className="mb-1" />
        <Skeleton width="80%" height="12px" />
      </div>
    </div>
  );
};

// Date Navigation Skeleton
export const DateNavigationSkeleton = () => {
  return (
    <div className="flex gap-2 w-full justify-between items-center mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton width="200px" height="36px" className="rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
  );
};

// Complete Time Slots Section Skeleton
export const TimeSlotsectionSkeleton = () => {
  return (
    <div className="w-full transition-all duration-300 ease-in-out space-y-4">
      {/* Morning Slots */}
      <div className="w-full mb-4">
        <Skeleton width="180px" height="20px" className="ml-2 mb-2" />
        <TimeSlotSkeleton />
      </div>

      {/* Afternoon Slots */}
      <div className="w-full mb-4">
        <Skeleton width="200px" height="20px" className="ml-2 mb-2" />
        <TimeSlotSkeleton />
      </div>

      {/* Evening Slots */}
      <div className="w-full">
        <Skeleton width="160px" height="20px" className="ml-2 mb-2" />
        <TimeSlotSkeleton />
      </div>
    </div>
  );
};