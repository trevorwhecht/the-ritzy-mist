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
            viewBox="0 0 100 800"
          >
            <motion.line
              x1="20"
              y1="0"
              x2="20"
              y2="800"
              stroke="#fff"
              strokeWidth="2"
              variants={draw}
            />
          </svg>
          
          <div className="pl-12 space-y-10">
            <motion.div custom={0} variants={textVariants}>
              <h2 className="text-3xl font-bold mb-2">CUSTOM TAN $55</h2>
              <p className="text-lg uppercase mb-1">BASIC PACKAGE WITHIN RADIUS</p>
              <p className="text-lg">• complements your unique skin tone</p>
              <p className="text-lg">• 30-45 minutes</p>
            </motion.div>

            <motion.div custom={1} variants={textVariants}>
              <h2 className="text-3xl font-bold mb-2">TRAVEL FEE</h2>
              <h3 className="text-2xl mb-2">CUSTOM TAN $70</h3>
              <p className="text-lg uppercase mb-1">FOR OUT OF RADIUS TANS</p>
              <p className="text-lg">• complements your unique skin tone</p>
              <p className="text-lg">• 45 minutes - 1 hour</p>
            </motion.div>

            <motion.div custom={2} variants={textVariants}>
              <h2 className="text-3xl font-bold mb-2">ADD ONS:</h2>
              <p className="text-lg uppercase mb-2">CHOOSE UP TO 3 MAX</p>
              <div className="space-y-2">
                <p className="text-lg">
                  • Gold Shimmer
                  <span className="inline-block ml-2">$5</span>
                </p>
                <p className="text-lg">
                  • Coconut Fragrance
                  <span className="inline-block ml-2">$8</span>
                </p>
                <p className="text-lg">
                  • Pineapple Fragrance
                  <span className="inline-block ml-2">$8</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 