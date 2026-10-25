'use client'

import React from 'react'

export default function AddOnMenu() {
  return (
    <div className="bg-black/50 border border-white rounded-lg p-6 font-[AlegreyaSansSC] text-white">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#d59586] mb-2">Add-On Menu</h3>
          <p className="text-gray-400 mb-4">*Mix & match up to 3 additives max*</p>
          <p className="text-gray-400 mb-4 font-bold">(Must decide on add-ons before booking)</p>
        </div>
        
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
  )
}
