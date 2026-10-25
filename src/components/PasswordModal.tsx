'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordModalProps {
  isOpen: boolean
  onSuccess: () => void
  correctPassword: string
}

export default function PasswordModal({ isOpen, onSuccess, correctPassword }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Small delay for better UX
    setTimeout(() => {
      if (password === correctPassword) {
        setIsSubmitting(false)
        onSuccess()
        setPassword('')
      } else {
        setIsSubmitting(false)
        setError('Incorrect password. Please try again.')
        setPassword('')
      }
    }, 300)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => {}} // Prevent closing on backdrop click for security
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-black border-2 border-white rounded-lg p-8 max-w-md w-full font-[AlegreyaSansSC]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Enter Password to Edit
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d59586] transition-colors"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !password}
                  className="w-full py-3 bg-[#d59586] text-white rounded-lg font-bold hover:bg-[#c48576] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Verifying...' : 'Submit'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

