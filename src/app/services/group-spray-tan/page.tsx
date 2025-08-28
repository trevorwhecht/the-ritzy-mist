'use client';

import { SectionHeader } from '@/components/SectionHeader';
import SkinTypes from '@/components/SkinTypes';
import GoogleBookingWidget from '@/components/GoogleBookingWidget';
import { useState, useCallback } from 'react';

export default function GroupSprayTanBooking() {
  const [showSkinTypes, setShowSkinTypes] = useState(true);
  
  // Memoize the click handler to prevent unnecessary re-renders
  const toggleSkinTypes = useCallback(() => {
    setShowSkinTypes(prev => !prev);
  }, []);

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="header-line my-8"></div>
        <div className="flex justify-center">
          <SectionHeader size="medium">Group Spary Tan</SectionHeader>
        </div>
        
        {/* Mobile Layout - Skin Types First, then Booking Widget */}
        <div className="block lg:hidden space-y-8">
          {/* Collapsible Skin Types */}
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleSkinTypes}
                className="text-[#d59586] hover:text-white transition-colors"
              >
                {showSkinTypes ? 'Hide' : 'Show'}
              </button>
            </div>
            <div 
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                height: showSkinTypes ? 'auto' : '0px',
                opacity: showSkinTypes ? 1 : 0
              }}
            >
              <SkinTypes />
            </div>
          </div>
          
          {/* Booking Widget - This should not re-render */}
          <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0r5d9m-AZfX9yevgQ9UmNnnuXcktAarQ3UkRJscREvG0EdJb5pIknxAnILvyEz2GR42A6ZPcmx?gv=true" />
        </div>
        
        {/* Desktop Layout - 2/3 Google Widget, 1/3 Skin Types */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 w-full">
          {/* Left Column - Google Widget (2/3) */}
          <div className="lg:col-span-2">
            <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0r5d9m-AZfX9yevgQ9UmNnnuXcktAarQ3UkRJscREvG0EdJb5pIknxAnILvyEz2GR42A6ZPcmx?gv=true" />
          </div>
          
          {/* Right Column - Skin Types (1/3) */}
          <div className="lg:col-span-1">
            <SkinTypes />
          </div>
        </div>
      </div>
    </div>
  );
}
