'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Head from 'next/head'
import CareList from '@/components/CareList'
import PasswordModal from '@/components/PasswordModal'
import { CareData, defaultCareData } from '@/lib/careData'

const PASSWORD = '6969'

export default function Care() {
  const searchParams = useSearchParams()
  const isEditable = searchParams?.get('isEditable') === 'true'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [care, setCare] = useState<CareData>(defaultCareData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetch('/api/content/care')
      .then(res => res.json())
      .then(data => setCare(data))
      .catch(() => setCare(defaultCareData))
  }, [])

  useEffect(() => {
    if (isEditable) {
      if (sessionStorage.getItem('pricing-auth') === 'true') {
        setIsAuthenticated(true)
      } else {
        setShowPasswordModal(true)
      }
    }
  }, [isEditable])

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true)
    setShowPasswordModal(false)
    sessionStorage.setItem('pricing-auth', 'true')
  }

  const editing = isEditable && isAuthenticated

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/content/care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: PASSWORD, data: care })
      })
      if (!res.ok) throw new Error('Failed')
      setSaveMessage({ type: 'success', text: 'Changes published! All visitors will see the updated care info.' })
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  return (
    <>
      <Head>
        <title>Spray Tan Care - The Ritzy Mist</title>
        <meta name="description" content="Essential spray tan preparation and aftercare tips for long-lasting, beautiful results." />
        <meta property="og:title" content="Spray Tan Care - The Ritzy Mist" />
        <meta property="og:description" content="Essential spray tan preparation and aftercare tips for long-lasting, beautiful results." />
        <meta property="og:url" content="https://theritzymist.com/spraytancare" />
        <meta name="twitter:title" content="Spray Tan Care - The Ritzy Mist" />
        <meta name="twitter:description" content="Essential spray tan preparation and aftercare tips for long-lasting, beautiful results." />
      </Head>
      <PasswordModal
        isOpen={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        correctPassword={PASSWORD}
      />
      <div className="min-h-screen pt-0 px-4 pb-96 bg-black">
        <div className="max-w-7xl mx-auto">
          {editing && (
            <div className="sticky top-0 z-40 flex flex-wrap items-center gap-4 bg-black/90 py-4 font-[AlegreyaSansSC]">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-[#d59586] text-white rounded-lg font-bold hover:bg-[#c48576] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Publishing...' : 'Publish Changes'}
              </button>
              <span className="text-gray-400 text-sm">Bold a lead-in with &lt;strong&gt;WORD&lt;/strong&gt;</span>
              {saveMessage && (
                <span className={saveMessage.type === 'success' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                  {saveMessage.text}
                </span>
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex md:flex-row flex-col gap-24 md:gap-24 items-start justify-center">
              <CareList
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-Prep.svg"
                alt="Spray Tan Preparation"
                width={400}
                height={533}
                items={care.prep}
                onChange={editing ? (prep) => setCare({ ...care, prep }) : undefined}
                className="mb-24 md:mb-0"
              />

              <CareList
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-aftercare.svg"
                alt="After Care"
                width={400}
                height={500}
                items={care.aftercare}
                onChange={editing ? (aftercare) => setCare({ ...care, aftercare }) : undefined}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
