'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Head from 'next/head'

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
    "*excessive sweating, hot tubs, saunas, hot baths & showers can cause faster discoloration*"
  ];

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
       <div className="min-h-screen pt-0 px-4 pb-32 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
           <div className="flex md:flex-row flex-col gap-24 md:gap-24 items-start justify-center">
             {/* Spray Tan Prep Section */}
             <div className="relative w-full max-w-md mb-24 md:mb-0">
              <Image
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-Prep.svg"
                alt="Spray Tan Preparation"
                width={400}
                height={533}
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 400px"
              />
              
              {/* Overlay bullet points */}
              <div className="absolute top-[70%] left-0 right-0 p-4 space-y-2">
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
            <div className="relative w-full max-w-md">
              <Image
                src="https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/SprayTanCare/sprayTan-aftercare.svg"
                alt="After Care"
                width={400}
                height={500}
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 400px"
              />
              
              {/* Overlay bullet points */}
              <div className="absolute top-[70%] left-0 right-0 p-4 space-y-2">
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
    </>
  )
} 