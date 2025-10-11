'use client'
import { SectionHeader } from '@/components/SectionHeader'
import PricingTabsComponent from '@/components/PricingTabs'

export default function PricingPage() {
  return (
    <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Price  List</SectionHeader>
        </div>
        <div className="w-full h-full pb-12">
          <div className="relative max-w-full-content mx-auto">
            <PricingTabsComponent />
          </div>
        </div>
      </div>
    </div>
  )
}
