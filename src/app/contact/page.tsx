'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { SectionHeader } from '@/components/SectionHeader'
import SkinTypeModal from '@/components/SkinTypeModal'

export default function ContactPage() {
  const searchParams = useSearchParams()
  const isGroup = searchParams.get('type') === 'group'
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    groupSize: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    inquiry: '',
    skinType: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'groupSize' && !/^\d*$/.test(value)) {
      setErrors(prev => ({
        ...prev,
        groupSize: 'Please enter a valid number'
      }))
      return
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus({ type: null, message: '' });
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (isGroup && (parseInt(formData.groupSize) < 4)) {
      newErrors.groupSize = 'Group size must be at least 4'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        groupSize: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        inquiry: '',
        skinType: ''
      });

      setSubmitStatus({
        type: 'success',
        message: 'Message sent successfully! I will get back to you soon.'
      });
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      });
    }
  }

  return (
    <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>Contact</SectionHeader>
        </div>
        <div className="min-h-screen pt-20 px-4 pb-12">
          <div className="max-w-2xl mx-auto">
            <div className="header-line my-8"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                      required
                    />
                  </div>
                </div>

                {isGroup && (
                  <>
                    <div className="relative">
                      <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                        Group Size
                      </label>
                      <input
                        type="text"
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border ${errors.groupSize ? 'border-[#d59586]' : 'border-white/20'} text-white focus:outline-none focus:border-[#d59586]`}
                        required
                      />
                      {errors.groupSize && (
                        <div className="mt-2 text-[#d59586]">
                          {errors.groupSize}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                          required
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                            required
                          />
                        </div>
                        <div className="relative">
                          <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-[#d59586]"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="relative">
                  <label className="text-white text-lg font-['AlegreyaSansSC'] mb-2 block">
                    Inquiry
                  </label>
                  <textarea
                    name="inquiry"
                    value={formData.inquiry}
                    onChange={handleChange}
                    placeholder={isGroup ? "Let me know any special request that you have for me!" : "How can I help you?"}
                    className="w-full px-4 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white h-32 focus:outline-none focus:border-[#d59586]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full border border-white text-white py-3 text-lg font-semibold transition-all duration-300 hover:bg-white hover:text-black hover:animate-glow mb-4"
                >
                  Send
                </button>

                {submitStatus.type && (
                  <div 
                    className={`text-center p-4 rounded-lg ${
                      submitStatus.type === 'success' 
                        ? 'bg-green-500/10 text-green-300' 
                        : 'bg-red-500/10 text-red-300'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 