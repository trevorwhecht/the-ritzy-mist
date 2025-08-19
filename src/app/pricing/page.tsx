'use client'
import { SectionHeader } from '@/components/SectionHeader'
import PriceList from '@/components/PriceList'

export default function PricingPage() {
  return (
    <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Price  List</SectionHeader>
        </div>
        <div className="w-full h-full pb-12">
          <div className="relative max-w-full-content mx-auto">
            <PriceList />
          </div>
        </div>
      </div>
    </div>
  )
}
