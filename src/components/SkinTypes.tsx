'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function SkinTypes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full h-full flex items-start"
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
    </motion.div>
  )
} 