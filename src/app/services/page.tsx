'use client';

import ServiceCard from '@/components/ServiceCard';
import { SectionHeader } from '@/components/SectionHeader'
import Head from 'next/head'

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
    <>
      <Head>
        <title>Services - The Ritzy Mist</title>
        <meta name="description" content="Professional spray tan services including studio and mobile options. Book your appointment today!" />
        <meta property="og:title" content="Services - The Ritzy Mist" />
        <meta property="og:description" content="Professional spray tan services including studio and mobile options. Book your appointment today!" />
        <meta property="og:url" content="https://theritzymist.com/services" />
        <meta name="twitter:title" content="Services - The Ritzy Mist" />
        <meta name="twitter:description" content="Professional spray tan services including studio and mobile options. Book your appointment today!" />
      </Head>
      <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Services</SectionHeader>
        </div>
        <ServiceCard />
      </div>
    </div>
    </>
  );
} 