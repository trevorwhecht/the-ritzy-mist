'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Policies() {
  return (
    <div className="min-h-screen pt-16 px-2 sm:pt-20 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full aspect-[75/100] lg:aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="https://static.wixstatic.com/media/d5800b_e378ecb571dc4d95ab62e5c2af70d886~mv2.png"
              alt="Policies"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
} 