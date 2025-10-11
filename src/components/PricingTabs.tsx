'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

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
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">✨ OG New Client — $55</h3>
                  <p className="text-gray-300">Perfect for first-time guests! Enjoy our signature formula designed to complement your natural undertones and give a radiant, sun-kissed glow with full hydration and smooth fade. This tan will have a rinse time between 8-12 hours.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">OG Mist — $65</h3>
                  <p className="text-gray-300">Our classic 8-hour developing tan that delivers a rich, natural bronze with lasting results. Ideal for those who don't mind leaving the solution on overnight for optimal depth and tone.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">OG + Finishing Powder — $70</h3>
                  <p className="text-gray-300">Everything you love about the OG Mist, finished with a silky-soft body powder that instantly sets your tan, reduces stickiness, and leaves you feeling fresh and comfortable post-spray.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">Rapid Mist — $75</h3>
                  <p className="text-gray-300">A customizable tan that develops in just 2–6 hours. Rinse sooner for a subtle glow or wait longer for a deeper bronze — perfect for same-day events or a quicker routine.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">✨ Rapid + Finishing Powder — $80</h3>
                  <p className="text-gray-300">Enjoy the convenience of our Rapid formula with the comfort of a soft-touch finishing powder. You'll leave feeling confident, dry, and glowing — even before your rinse.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">Bridal Trial Glow — $70</h3>
                  <p className="text-gray-300">Includes: Rapid Clear formula, finishing powder, and one complimentary add-on of your choice. A perfect preview of your wedding-day glow — natural, radiant, and fully customizable.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">Bridal Glow — $85</h3>
                  <p className="text-gray-300">Our most luxurious tan, crafted for brides and special occasions. This formula gives a flawless, camera-ready glow that's soft, smooth, and radiant in every light — no orange tones, no transfer, just pure confidence. Includes our finishing powder for instant comfort and set. Rinse same day!</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">✨🎉 Birthday Bronze — $50</h3>
                  <p className="text-gray-300">It's your day to glow! Celebrate yourself with our exclusive birthday spray tan with our OG solution - a rich, radiant bronze that enhances your natural tone while keeping your skin hydrated and luminous. Includes our finishing powder for that instantly dry, silky feel.</p>
                </div>
              </div>

              {/* Add-Ons */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-[#d59586] mb-4">Add-On Menu</h3>
                <p className="text-gray-400 mb-4">*Mix & match up to 3 additives max*</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2">✨ Scents & Shimmer — $5 each</h4>
                    <p className="text-gray-300 mb-2">Choose your glow personality with one of our luxe finishing options:</p>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Orange Ginger — warm, invigorating, and citrusy</li>
                      <li>• Pineapple — tropical, sweet, and playful</li>
                      <li>• Coconut — classic beachy escape</li>
                      <li>• Golden Shimmer — a subtle, radiant sheen that enhances your tan instantly</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold mb-2">💧 Skin Enhancers — $8 each</h4>
                    <p className="text-gray-300 mb-2">Targeted additives to elevate your tan and skin's appearance:</p>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Anti-Aging — helps smooth fine lines and boost elasticity</li>
                      <li>• Skin Firming — tones and tightens for a youthful glow</li>
                      <li>• DHA Booster — deepens your tan for a richer, longer-lasting bronze</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold mb-2">🌿 Restore CBD Concentrate — $10</h4>
                    <p className="text-gray-300">Soothes, calms, and hydrates skin post-tan while promoting overall balance and recovery — perfect for sensitive or dry skin types.</p>
                  </div>
                </div>
              </div>
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
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">OG Mist — $75</h3>
                  <p className="text-gray-300">Bringing everything to you! Our signature 8-hour developing formula gives a natural, hydrated bronze right from the comfort of your own space. We always finish the session off with a setting powder to make sure you're as comfortable as possible.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">✨ Rapid Mist — $90</h3>
                  <p className="text-gray-300">On-the-go glam. Achieve a golden, customizable tan in as little as 2-6 hours. This is perfect for last-minute plans or busy schedules. Every mobile service has all of the essentials to make the session go seamless. Setting powder is always included in this service.</p>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold text-[#d59586] mb-2">Mobile Bridal Glow — $100</h3>
                  <p className="text-gray-300">Perfect for your big day or any day you want to feel your most radiant. Enjoy our premium solution, rinsing within 2-6 hrs, and powder finish from the comfort of your home, hotel, or venue. We ensure a seamless, streak-free glow designed to photograph beautifully and last through every celebration.</p>
                </div>
              </div>

              {/* Add-Ons */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-[#d59586] mb-2">Add-On Menu</h3>
                <p className="text-gray-400 mb-4">*Mix & match up to 3 additives max*</p>
                <p className="text-gray-400 mb-4 font-bold">(Must decide on add-ons before booking)</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2">✨ Scents & Shimmer — $5 each</h4>
                    <p className="text-gray-300 mb-2">Choose your glow personality with one of our luxe finishing options:</p>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Orange Ginger — warm, invigorating, and citrusy</li>
                      <li>• Pineapple — tropical, sweet, and playful</li>
                      <li>• Coconut — classic beachy escape</li>
                      <li>• Golden Shimmer — a subtle, radiant sheen that enhances your tan instantly</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold mb-2">💧 Skin Enhancers — $8 each</h4>
                    <p className="text-gray-300 mb-2">Targeted additives to elevate your tan and skin's appearance:</p>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Anti-Aging — helps smooth fine lines and boost elasticity</li>
                      <li>• Skin Firming — tones and tightens for a youthful glow</li>
                      <li>• DHA Booster — deepens your tan for a richer, longer-lasting bronze</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold mb-2">🌿 Restore CBD Concentrate — $10</h4>
                    <p className="text-gray-300">Soothes, calms, and hydrates skin post-tan while promoting overall balance and recovery — perfect for sensitive or dry skin types.</p>
                  </div>
                </div>
              </div>
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
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-[#d59586] mb-4">Perfect for bridal parties, girls' nights, birthdays, and pre-vacay glow sessions!</h3>
              </div>

              <div className="space-y-6">
                <div className="border-b border-gray-600 pb-4">
                  <h4 className="text-2xl font-bold text-white mb-4">Individual pricing within groups:</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">OG Mist</span>
                      <span className="text-xl font-bold text-[#d59586]">$60 each</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Rapid Mist</span>
                      <span className="text-xl font-bold text-[#d59586]">$75 each</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-600 pb-4">
                  <h4 className="text-xl font-bold text-white mb-2">Requirements:</h4>
                  <p className="text-gray-300">Minimum of 5 guests.</p>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Pricing:</h4>
                  <p className="text-gray-300">Pricing can vary based on location.</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg mt-8">
                  <h4 className="text-xl font-bold text-[#d59586] mb-2">Ready to book your group glow?</h4>
                  <p className="text-gray-300">To inquire or book your group glow, please email or text us directly for a custom quote.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PricingTabsComponent
