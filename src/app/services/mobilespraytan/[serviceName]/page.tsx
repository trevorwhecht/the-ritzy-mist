'use client';

import { SectionHeader } from '@/components/SectionHeader';
import SkinTypes from '@/components/SkinTypes';
import GoogleBookingWidget from '@/components/GoogleBookingWidget';
import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

export default function MobileSprayTanBooking() {
  const [showSkinTypes, setShowSkinTypes] = useState(true);
  const params = useParams();
  const serviceName = params.serviceName as string;
  
  // Service mapping with prices
  const serviceMap: Record<string, { name: string; price: string }> = {
    'og-mist': { name: 'OG MIST', price: '$75' },
    'rapid-mist': { name: '✨ RAPID MIST', price: '$90' },
    'mobile-bridal-glow': { name: 'MOBILE BRIDAL GLOW', price: '$100' }
  };
  
  // Get service details or format from slug as fallback
  const serviceDetails = serviceName && serviceMap[serviceName] 
    ? serviceMap[serviceName]
    : {
        name: serviceName
          ? serviceName.split('-').map(word => word.toUpperCase()).join(' ')
          : '',
        price: ''
      };
  
  // Memoize the click handler to prevent unnecessary re-renders
  const toggleSkinTypes = useCallback(() => {
    setShowSkinTypes(prev => !prev);
  }, []);

  return (
    <div className="relative z-10 min-h-[500vh] lg:min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="header-line my-8"></div>
        <div className="flex justify-center">
          <SectionHeader size="medium">Mobile Spray Tan</SectionHeader>
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
          
          {/* Service Type Display */}
          {serviceDetails.name && (
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-[#d59586] font-[AlegreyaSansSC]">
                Service Type: {serviceDetails.name} {serviceDetails.price && `— ${serviceDetails.price}`}
              </h2>
            </div>
          )}
          
          {/* Booking Widget - This should not re-render */}
          <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0DYx6swYNG1DyHPW9nZTahCMhE2M75X1z4gmLN2tfkU2EWxvNbVqCGOTKrrbBdEj6MFB-iMTi-?gv=true" />
        </div>
        
        {/* Desktop Layout - 2/3 Google Widget, 1/3 Skin Types */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 w-full">
          {/* Left Column - Google Widget (2/3) */}
          <div className="lg:col-span-2">
            {/* Service Type Display */}
            {serviceDetails.name && (
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-[#d59586] font-[AlegreyaSansSC]">
                  Service Type: {serviceDetails.name} {serviceDetails.price && `— ${serviceDetails.price}`}
                </h2>
              </div>
            )}
            <GoogleBookingWidget src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0DYx6swYNG1DyHPW9nZTahCMhE2M75X1z4gmLN2tfkU2EWxvNbVqCGOTKrrbBdEj6MFB-iMTi-?gv=true" />
          </div>
          
          {/* Right Column - Skin Types (1/3) */}
          <div className="lg:col-span-1">
            <SkinTypes />
          </div>
        </div>
        
        {/* Extra spacing for mobile to eliminate widget scrolling */}
        <div className="block lg:hidden h-[200vh]"></div>
      </div>
    </div>
  );
}

