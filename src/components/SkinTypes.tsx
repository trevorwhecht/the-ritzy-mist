'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function SkinTypes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full h-full flex flex-col items-start"
    >
      <div className="relative w-full aspect-[4/5] max-w-[500px]">
        <Image
          src="https://static.wixstatic.com/media/d5800b_61aebd2cd7cf41a89f7a04421a1104b7~mv2.png"
          alt="Fitzpatrick Skin Type Scale"
          fill
          className="object-contain"
          priority
        />
      </div>
      
      {/* Add-On Menu Content */}
      <div className="w-full max-w-[500px] mt-8">
        <div className="border border-white rounded-lg p-6 space-y-6">
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
                <li>• ORANGE GINGER — Warm, invigorating, and citrusy</li>
                <li>• PINEAPPLE — Tropical, sweet, and playful</li>
                <li>• COCONUT — Classic beachy escape</li>
                <li>• GOLDEN SHIMMER — A subtle, radiant sheen that enhances your tan instantly</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-2">💧 Skin Enhancers — $8 each</h4>
              <p className="text-gray-300 mb-2">Targeted additives to elevate your tan and skin&apos;s appearance:</p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• ANTI-AGING — Helps smooth fine lines and boost elasticity</li>
                <li>• SKIN FIRMING — Tones and tightens for a youthful glow</li>
                <li>• DHA BOOSTER — Deepens your tan for a richer, longer-lasting bronze</li>
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
  )
} 