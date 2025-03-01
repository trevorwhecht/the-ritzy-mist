'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

export default function SkinTypeModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col items-center">
      <p className="text-white mb-2 font-['AlegreyaSansSC'] text-2xl">
        Not sure of your skin type?
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-6 py-2 text-white bg-transparent border border-white rounded-md hover:border-white/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 font-['AlegreyaSansSC'] text-lg"
        aria-label="View skin type guide"
      >
        View Skin Type Guide
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
              className="fixed inset-0 bg-black/80 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-0 right-0 top-0 bottom-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative bg-black p-6 rounded-lg border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="bg-transparent border border-white text-white px-4 py-2 rounded-md hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 font-['AlegreyaSansSC']"
                  >
                    Close
                  </button>
                </div>

                <div className="relative w-full aspect-[4/5] mx-auto">
                  <Image
                    src="https://static.wixstatic.com/media/d5800b_61aebd2cd7cf41a89f7a04421a1104b7~mv2.png"
                    alt="Fitzpatrick Skin Type Scale"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 