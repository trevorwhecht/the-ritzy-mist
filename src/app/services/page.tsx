'use client';

import ServiceCard from '@/components/ServiceCard';
import { SectionHeader } from '@/components/SectionHeader'

declare global {
  interface Window {
    calendar?: {
      schedulingButton: {
        load: (config: any) => void;
      };
    };
  }
}

export default function Page() {
  return (
    <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Services</SectionHeader>
        </div>
        <ServiceCard />
      </div>
    </div>
  );
} 