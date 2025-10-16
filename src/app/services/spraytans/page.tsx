'use client';

import { SectionHeader } from '@/components/SectionHeader';
import SkinTypesOnly from '@/components/SkinTypesOnly';
import GoogleBookingWidget from '@/components/GoogleBookingWidget';
import { useState, useCallback } from 'react';
import Script from 'next/script';

export default function SprayTansBooking() {
  const [showSkinTypes, setShowSkinTypes] = useState(true);
  
  // Memoize the click handler to prevent unnecessary re-renders
  const toggleSkinTypes = useCallback(() => {
    setShowSkinTypes(prev => !prev);
  }, []);

  return (
    <>
      {/* Facebook Pixel ViewContent Event */}
      <Script id="facebook-viewcontent" strategy="afterInteractive">
        {`
          fbq('track', 'ViewContent', {
            value: 'View Booking page',
            currency: 'US',
            content_ids: '1',
            content_type: 'View',
          });
        `}
      </Script>
      
      <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="header-line my-8"></div>
        <div className="flex justify-center">
          <SectionHeader>Book Now</SectionHeader>
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
              <SkinTypesOnly />
            </div>
          </div>
          
          {/* Booking Widget - This should not re-render */}
          <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1EEUVkQgRuvSijzsK_YLbl2N6V_j0ELIEVZtLgyCLU1AEhX6zVnE1p-P92yzXc_RLC5nIxwldE?gv=true&showTitle=0&showCalendarLink=0&showNav=0&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=%23ffffff&color=%23000000&hl=en" />
        </div>
        
        {/* Desktop Layout - 2/3 Google Widget, 1/3 Skin Types */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 w-full">
          {/* Left Column - Google Widget (2/3) */}
          <div className="lg:col-span-2">
            <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1EEUVkQgRuvSijzsK_YLbl2N6V_j0ELIEVZtLgyCLU1AEhX6zVnE1p-P92yzXc_RLC5nIxwldE?gv=true&showTitle=0&showCalendarLink=0&showNav=0&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=%23ffffff&color=%23000000&hl=en" />
          </div>
          
          {/* Right Column - Skin Types (1/3) */}
          <div className="lg:col-span-1">
            <SkinTypesOnly />
          </div>
        </div>
      </div>
    </div>
    </>
  );
} 