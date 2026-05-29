'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { type PricingData } from '@/lib/pricingData'

// Types
interface Tab {
  id: string
  label: string
}

interface PricingTabsComponentProps {
  initialActiveTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

const PricingTabsComponent: React.FC<PricingTabsComponentProps> = ({
  initialActiveTab = 'inStudio',
  onTabChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [pricingData, setPricingData] = useState<PricingData | null>(null)

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricingData(data))
      .catch(() => setPricingData(null))
  }, [])

  // Helper function to convert service title to URL slug
  const createServiceSlug = (title: string): string => {
    // Extract service name before the price (before "—" or "-")
    const serviceName = title.split('—')[0].split('—')[0].trim()
    // Remove emojis and special characters, convert to lowercase and replace spaces with hyphens
    return serviceName
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
  }

  // Wait for data to load
  if (!pricingData) {
    return <div className={`text-white ${className}`}>Loading...</div>
  }

  const tabs: Tab[] = [
    { id: 'inStudio', label: 'IN STUDIO SPRAY' },
    { id: 'mobile', label: 'MOBILE SPRAY' },
    { id: 'group', label: 'GROUP SPRAY' }
  ]

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={`text-white ${className}`}>
      {/* Folder-style tabs */}
      <div className="relative mb-0 max-w-4xl mx-auto">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              className="relative flex-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`relative px-2 md:px-6 py-3 rounded-t-lg text-xs md:text-base transition-all duration-300 border-2 w-full font-[AlegreyaSansSC] ${
                  activeTab === tab.id
                    ? 'bg-stone-800 text-white border-white z-10'
                    : 'bg-black text-white border-white hover:bg-gray-900'
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-stone-800 rounded-t-lg border-2 border-white"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tab Content Areas */}
      <div className="relative">
        {/* In Studio Spray Tab */}
        {activeTab === 'inStudio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              {/* Main Services */}
              <div className="space-y-6">
                {pricingData.inStudio.services.map((service) => {
                  const serviceLink = service.link || `/services/spraytans/${createServiceSlug(service.title)}`
                  return (
                    <div key={service.id} className="border-b border-gray-600 pb-4">
                      {serviceLink ? (
                        <Link href={serviceLink} className="hover:opacity-80 transition-opacity">
                          <h3 className="text-2xl font-bold text-[#d59586] mb-2 cursor-pointer">
                            {service.title} — {service.price}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-2xl font-bold text-[#d59586] mb-2">
                          {service.title} — {service.price}
                        </h3>
                      )}
                      <p className="text-gray-300">{service.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* Add-Ons */}
              {pricingData.inStudio.addOns && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-4">{pricingData.inStudio.addOns.title}</h3>
                  {pricingData.inStudio.addOns.description && (
                    <p className="text-gray-400 mb-4">{pricingData.inStudio.addOns.description}</p>
                  )}
                  
                  <div className="space-y-4">
                    {pricingData.inStudio.addOns.items.map((item, index) => (
                      <div key={index}>
                        <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                        <p className="text-gray-300">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mobile Spray Tab */}
        {activeTab === 'mobile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              <div className="space-y-6">
                {pricingData.mobile.services.map((service) => {
                  const serviceLink = service.link || `/services/mobilespraytan/${createServiceSlug(service.title)}`
                  return (
                    <div key={service.id} className="border-b border-gray-600 pb-4">
                      {serviceLink ? (
                        <Link href={serviceLink} className="hover:opacity-80 transition-opacity">
                          <h3 className="text-2xl font-bold text-[#d59586] mb-2 cursor-pointer">
                            {service.title} — {service.price}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-2xl font-bold text-[#d59586] mb-2">
                          {service.title} — {service.price}
                        </h3>
                      )}
                      <p className="text-gray-300">{service.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* Add-Ons */}
              {pricingData.mobile.addOns && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">{pricingData.mobile.addOns.title}</h3>
                  {pricingData.mobile.addOns.description && (
                    <>
                      <p className="text-gray-400 mb-4">{pricingData.mobile.addOns.description.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < pricingData.mobile.addOns!.description!.split('\n').length - 1 && <br />}
                        </span>
                      ))}</p>
                    </>
                  )}
                  
                  <div className="space-y-4">
                    {pricingData.mobile.addOns.items.map((item, index) => (
                      <div key={index}>
                        <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                        <p className="text-gray-300">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Group Spray Tab */}
        {activeTab === 'group' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border border-white rounded-b-lg p-6 font-[AlegreyaSansSC] max-w-4xl mx-auto"
          >
            <div className="space-y-8">
              {pricingData.group.header && (
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-[#d59586] mb-4">{pricingData.group.header}</h3>
                </div>
              )}

              <div className="space-y-6">
                {pricingData.group.items.length > 0 && (
                  <div className="border-b border-gray-600 pb-4">
                    <h4 className="text-2xl font-bold text-white mb-4">Individual pricing within groups:</h4>
                    <div className="space-y-3">
                      {pricingData.group.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-xl font-bold">{item.label}</span>
                          <span className="text-xl font-bold text-[#d59586]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pricingData.group.sections.map((section, index) => (
                  <div key={index} className={index < pricingData.group.sections.length - 1 ? 'border-b border-gray-600 pb-4' : ''}>
                    <h4 className="text-xl font-bold text-white mb-2">{section.title}</h4>
                    <p className="text-gray-300">{section.content}</p>
                  </div>
                ))}

                {pricingData.group.footer && (
                  <div className="bg-gray-800 p-6 rounded-lg mt-8">
                    <h4 className="text-xl font-bold text-[#d59586] mb-2">{pricingData.group.footer.title}</h4>
                    <p className="text-gray-300">{pricingData.group.footer.content}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PricingTabsComponent

