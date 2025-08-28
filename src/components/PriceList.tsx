'use client'
import { motion } from 'framer-motion'

export default function PriceList() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" },
        opacity: { duration: 0.01 }
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 1
      }
    })
  };

  return (
    <div className="w-full">
      {/* Mobile Layout - Single Column with Left Border */}
      <div className="block md:hidden">
        <div className="relative w-full h-full flex items-start">
          <motion.div
            initial="hidden"
            animate="visible"
            className="w-full text-white font-['AlegreyaSansSC']"
          >
            <div className="relative">
              <svg
                className="absolute left-0 h-full"
                width="100"
                height="100%"
                viewBox="0 0 100 1200"
              >
                <motion.line
                  x1="20"
                  y1="0"
                  x2="20"
                  y2="1200"
                  stroke="#fff"
                  strokeWidth="2"
                  variants={draw}
                />
              </svg>
              
              <div className="pl-12 space-y-10">
                <motion.div custom={0} variants={textVariants}>
                  <h2 className="text-3xl font-bold mb-2">OG MIST $75+</h2>
                  <p className="text-lg mb-2">• Develops in 8 hours, complements your unique skin tone.</p>
                  <p className="text-lg mb-2">• This option is perfect for those who don't mind the wait and want a rich, natural-looking bronze with full hydration and longevity.</p>
                  <p className="text-lg">• Ideal for those who can leave the tan on overnight for optimal results.</p>
                </motion.div>

                <motion.div custom={1} variants={textVariants}>
                  <h2 className="text-3xl font-bold mb-2">RAPID MIST $90+</h2>
                  <p className="text-lg mb-2">• This formula develops in 2-6 hours for a customizable tan depth that you like.</p>
                  <p className="text-lg mb-2">• Rinse sooner for a lighter glow or wait longer for a deeper bronze.</p>
                  <p className="text-lg">• Ideal for last-minute events or those who prefer a quicker routine!</p>
                </motion.div>

                <motion.div custom={2} variants={textVariants}>
                  <h2 className="text-3xl font-bold mb-2">GROUP</h2>
                  <h3 className="text-2xl font-bold mb-2">RITZY TAN $300+</h3>
                  <p className="text-lg mb-2">• Price can vary based on location.</p>
                  <p className="text-lg mb-2">• Individual Pricing within Group:</p>
                  <p className="text-lg mb-1">  - $60 each for OG Mist</p>
                  <p className="text-lg mb-2">  - $75 each for Rapid Mist</p>
                  <p className="text-lg">• Requirement: At least 5+ guests</p>
                </motion.div>

                <motion.div custom={3} variants={textVariants}>
                  <h2 className="text-3xl font-bold mb-2">ADD ONS:</h2>
                  <p className="text-lg uppercase mb-2">CHOOSE UP TO 3 MAX</p>
                  <div className="space-y-2">
                    <p className="text-lg">
                      • Gold Shimmer
                      <span className="inline-block ml-2">$8</span>
                    </p>
                    <p className="text-lg">
                      • Coconut Fragrance
                      <span className="inline-block ml-2">$10</span>
                    </p>
                    <p className="text-lg">
                      • Pineapple Fragrance
                      <span className="inline-block ml-2">$10</span>
                    </p>
                    <p className="text-lg">
                      • Orange Ginger Fragrance
                      <span className="inline-block ml-2">$10</span>
                    </p>
                    <p className="text-lg">
                      • Anti-Aging
                      <span className="inline-block ml-2">$15</span>
                    </p>
                  </div>
                </motion.div>

                <motion.div custom={4} variants={textVariants} className="pt-8">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-bold">Instagram: @theritzymist</p>
                    <p className="text-lg font-bold">I COME TO YOU!</p>
                    <p className="text-lg font-bold">(916) 628-4899</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout - 3 Columns with Add-ons Below */}
      <div className="hidden md:block">
        <motion.div
          initial="hidden"
          animate="visible"
          className="w-full text-white font-['AlegreyaSansSC']"
        >
          {/* Main Services - 3 Columns */}
          <div className="grid grid-cols-3 gap-8 mb-16">
            {/* OG MIST */}
            <motion.div custom={0} variants={textVariants} className="text-center">
              <h2 className="text-3xl font-bold mb-4">OG MIST</h2>
              <h3 className="text-4xl font-bold mb-4 text-[#d59586]">$75+</h3>
              <div className="space-y-3 text-left">
                <p className="text-lg">• Develops in 8 hours, complements your unique skin tone.</p>
                <p className="text-lg">• This option is perfect for those who don't mind the wait and want a rich, natural-looking bronze with full hydration and longevity.</p>
                <p className="text-lg">• Ideal for those who can leave the tan on overnight for optimal results.</p>
              </div>
            </motion.div>

            {/* RAPID MIST */}
            <motion.div custom={1} variants={textVariants} className="text-center">
              <h2 className="text-3xl font-bold mb-4">RAPID MIST</h2>
              <h3 className="text-4xl font-bold mb-4 text-[#d59586]">$90+</h3>
              <div className="space-y-3 text-left">
                <p className="text-lg">• This formula develops in 2-6 hours for a customizable tan depth that you like.</p>
                <p className="text-lg">• Rinse sooner for a lighter glow or wait longer for a deeper bronze.</p>
                <p className="text-lg">• Ideal for last-minute events or those who prefer a quicker routine!</p>
              </div>
            </motion.div>

            {/* GROUP */}
            <motion.div custom={2} variants={textVariants} className="text-center">
              <h2 className="text-3xl font-bold mb-4">GROUP</h2>
              <h3 className="text-4xl font-bold mb-4 text-[#d59586]">$300+</h3>
              <div className="space-y-3 text-left">
                <p className="text-lg">• Price can vary based on location.</p>
                <p className="text-lg">• Individual Pricing within Group:</p>
                <p className="text-lg">  - $60 each for OG Mist</p>
                <p className="text-lg">  - $75 each for Rapid Mist</p>
                <p className="text-lg">• Requirement: At least 5+ guests</p>
              </div>
            </motion.div>
          </div>

          {/* Add-ons Section - Full Width Below */}
          <motion.div custom={3} variants={textVariants} className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">ADD ONS</h2>
            <p className="text-lg uppercase mb-6">CHOOSE UP TO 3 MAX</p>
            <div className="grid grid-cols-5 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <p className="text-lg font-bold">Gold Shimmer</p>
                <p className="text-2xl font-bold text-[#d59586]">$8</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Coconut Fragrance</p>
                <p className="text-2xl font-bold text-[#d59586]">$10</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Pineapple Fragrance</p>
                <p className="text-2xl font-bold text-[#d59586]">$10</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Orange Ginger Fragrance</p>
                <p className="text-2xl font-bold text-[#d59586]">$10</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Anti-Aging</p>
                <p className="text-2xl font-bold text-[#d59586]">$15</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
} 