'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SectionHeader } from '@/components/SectionHeader'
import PricingTabsComponent from '@/components/PricingTabs'
import EditablePricingTabs from '@/components/EditablePricingTabs'
import PasswordModal from '@/components/PasswordModal'

const PASSWORD = '6969'

export default function PricingPage() {
  const searchParams = useSearchParams()
  const isEditable = searchParams?.get('isEditable') === 'true'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (isEditable) {
      // Check if already authenticated (stored in session)
      const authStatus = sessionStorage.getItem('pricing-auth')
      if (authStatus === 'true') {
        setIsAuthenticated(true)
      } else {
        setShowPasswordModal(true)
      }
    }
  }, [isEditable])

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true)
    setShowPasswordModal(false)
    sessionStorage.setItem('pricing-auth', 'true')
  }

  return (
    <div className="relative">
      <PasswordModal
        isOpen={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        correctPassword={PASSWORD}
      />
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Price  List</SectionHeader>
        </div>
        <div className="w-full h-full pb-12">
          <div className="relative max-w-full-content mx-auto">
            {isEditable && isAuthenticated ? (
              <EditablePricingTabs password={PASSWORD} />
            ) : (
              <PricingTabsComponent />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
