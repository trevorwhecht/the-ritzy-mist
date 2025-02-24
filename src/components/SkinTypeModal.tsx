'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

export default function SkinTypeModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-6 h-6 ml-2 text-sm font-semibold text-white bg-[#d59586] rounded-full hover:bg-[#c48475] transition-colors"
        aria-label="Skin type information"
      >
        i
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-2xl"
            >
              <div className="relative bg-black/90 p-6 rounded-lg border border-white/20">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  ✕
                </button>
                <h3 className="text-2xl font-['AlegreyaSansSC'] mb-4 text-white">Fitzpatrick Skin Type Scale</h3>
                <div className="relative w-full aspect-[4/5]">
                  <Image
                    src="https://static.wixstatic.com/media/d5800b_61aebd2cd7cf41a89f7a04421a1104b7~mv2.png"
                    alt="Fitzpatrick Skin Type Scale"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 