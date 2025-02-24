'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Care() {
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="relative w-full aspect-[75/100] rounded-lg overflow-hidden">
              <Image
                src="https://static.wixstatic.com/media/d5800b_0d4a8acd1a52409d8668cfb79d4b079f~mv2.png"
                alt="Spray Tan Preparation"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="relative mt-8 w-full aspect-[4/5] rounded-lg overflow-hidden md:scale-110 md:-ml-10 ">
              <Image
                src="https://static.wixstatic.com/media/d5800b_143d91a3c41846df844e6887975f68a1~mv2.png"
                alt="After Care"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 