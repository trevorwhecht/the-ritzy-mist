'use client';

import { SectionHeader } from '@/components/SectionHeader';
import SkinTypeModal from '@/components/SkinTypeModal';

export default function SprayTansBooking() {
  const googleWidget = `
    <iframe 
      src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1EEUVkQgRuvSijzsK_YLbl2N6V_j0ELIEVZtLgyCLU1AEhX6zVnE1p-P92yzXc_RLC5nIxwldE?gv=true&showTitle=0&showCalendarLink=0&showNav=0&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=%23ffffff&color=%23000000&hl=en" 
      style="border: 0; max-width: 1200px; width: 100%; height: 1400px; margin: 0 auto; display: block; background: transparent;" 
      class="h-[1400px] md:h-[1000px]"
      frameborder="0"
    ></iframe>
  `;

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="header-line my-8"></div>
        <div className="flex justify-center">
          <SectionHeader>Book Now</SectionHeader>
        </div>
        <div className="max-w-6xl mx-auto bg-white/75 rounded-lg p-4">
          <div dangerouslySetInnerHTML={{ __html: googleWidget }} />
        </div>
      </div>
    </div>
  );
} 