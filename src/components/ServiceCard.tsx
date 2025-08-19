'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PriceList from './PriceList'
import SkinTypes from './SkinTypes'

const services = [
  {
    title: "Spray Tans",
    description: "Get that perfect, natural-looking glow with our professional spray tanning service. Each session is customized to your skin tone and preferences.",
    price: "Starting at $75",
    imageUrl: "https://static.wixstatic.com/media/d5800b_721ae815a6d34adf8b1f6c61d9ff8b01~mv2.jpg",
    href: "/services/spraytans"
  },
  {
    title: "Group Spray Tans",
    description: "Perfect for bridal parties, special events, or just a fun day with friends! Enjoy group discounts and a great bonding experience.",
    price: "Starting at $300 (minimum 5 people)",
    imageUrl: "https://static.wixstatic.com/media/d5800b_aceccedf547042f786db66be28354135~mv2.jpg",
    href: "/contact?type=group"
  }
]

interface ServiceCardProps {
  showPriceList?: boolean;
  showSkinTypes?: boolean;
}

export default function ServiceCard({ showPriceList = false, showSkinTypes = true }: ServiceCardProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-evenly items-start gap-8">
      {/* Services Section */}
      <div className="w-full lg:w-[30%] flex flex-col md:flex-row justify-center gap-6">
        {services.map((service, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="w-full bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden border border-white"
          >
            <div className="flex flex-col h-full">
              <div className="h-[200px] relative">
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  className="object-contain"
                  sizes="25vw"
                  priority
                />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-300 mb-6">{service.description}</p>
                <p className="text-lg font-semibold mb-6">{service.price}</p>
                <div className="mt-auto">
                  <Link 
                    href={service.href}
                    className="block w-full border border-white bg-white/10 text-white px-6 py-3 text-lg font-semibold text-center hover:bg-white hover:text-black transition-all duration-300"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skin Types Section */}
      {showSkinTypes && (
        <div className="w-full lg:w-[30%]">
          <SkinTypes />
        </div>
      )}

      {/* Price List Section */}
      {showPriceList && (
        <div className="w-full lg:w-[30%]">
          <PriceList />
        </div>
      )}
    </div>
  )
} 