'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Care() {
  const prepItems = [
    "<strong>SHOWER</strong> 3-12 hrs before appt",
    "<strong>EXFOLIATE/SHAVE/WAX</strong> 24 hrs before appt, pores need time to close before application",
    "<strong>AVOID</strong> lotions, sunscreens, creams, gels, oils and perfumes day of. They leave residue on the skin preventing even application.",
    "<strong>DO NOT</strong> wear makeup or deodorant to appt.",
    "<strong>WEAR</strong> loose dark baggy clothing after application."
  ];

  const aftercareItems = [
    "<strong>AVOID</strong> any and all contact with sweat, water or liquids until first rinse.",
    "<strong>WAIT TO RINSE</strong> for the recommended time by your artist. If sleeping in it, make sure to wear long baggy clothes to avoid transfer on to other body parts or sheets.",
    "<strong>RINSE</strong> with lukewarm water until water runs clear. No soap & pat dry.",
    "<strong>MOISTURIZE</strong> skin daily with a gradual tanning lotion.",
    "<strong>USE</strong> safe products that are sulfate free, paraben free, and alcohol free for long lasting results.",
    "<strong>STAY HYDRATED</strong> to keep your skin and tan looking fresh",
    "*<strong>excessive sweating</strong>, hot tubs, saunas, hot baths & showers can cause faster discoloration*"
  ];

  return (
    <div className="min-h-screen pt-0 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Spray Tan Prep Section */}
            <div className="relative w-full aspect-[75/100] rounded-lg overflow-hidden">
              <Image
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-Prep.svg"
                alt="Spray Tan Preparation"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Overlay bullet points */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                {prepItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border-2 border-black rounded-full px-4 py-2 text-black text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item }}
                  >
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Spray Tan Aftercare Section */}
            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden md:scale-110 md:-ml-10 md:mt-0">
              <Image
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-aftercare.svg"
                alt="After Care"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Overlay bullet points */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                {aftercareItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border-2 border-black rounded-full px-4 py-2 text-black text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item }}
                  >
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 