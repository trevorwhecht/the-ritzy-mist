// Pricing data structure and utilities

export interface PricingItem {
  id: string
  title: string
  description: string
  price: string
  link?: string // Optional service link
}

export interface PricingTabData {
  services: PricingItem[]
  addOns?: {
    title: string
    description?: string
    items: Array<{
      title: string
      description: string
      price?: string
    }>
  }
}

export interface PricingData {
  inStudio: PricingTabData
  mobile: PricingTabData
  group: {
    header?: string
    items: Array<{
      label: string
      value: string
    }>
    sections: Array<{
      title: string
      content: string
    }>
    footer?: {
      title: string
      content: string
    }
  }
}

// Default pricing data structure
export const defaultPricingData: PricingData = {
  inStudio: {
    services: [
      {
        id: 'og-new-client',
        title: '✨ OG New Client',
        description: 'Perfect for first-time guests! Enjoy our signature formula designed to complement your natural undertones and give a radiant, sun-kissed glow with full hydration and smooth fade. This tan will have a rinse time between 8-12 hours.',
        price: '$55',
        link: '/services/spraytans/og-new-client'
      },
      {
        id: 'og-finishing-powder',
        title: 'OG + Finishing Powder',
        description: 'Everything you love about the OG Mist, finished with a silky-soft body powder that instantly sets your tan, reduces stickiness, and leaves you feeling fresh and comfortable post-spray.',
        price: '$70',
        link: '/services/spraytans/og-finishing-powder'
      },
      {
        id: 'rapid-finishing-powder',
        title: '✨ Rapid + Finishing Powder',
        description: "Enjoy the convenience of our Rapid formula with the comfort of a soft-touch finishing powder. You'll leave feeling confident, dry, and glowing — even before your rinse.",
        price: '$80',
        link: '/services/spraytans/rapid-finishing-powder'
      },
      {
        id: 'bridal-trial-glow',
        title: 'Bridal Trial Glow',
        description: 'Includes: Rapid Clear formula, finishing powder, and one complimentary add-on of your choice. A perfect preview of your wedding-day glow — natural, radiant, and fully customizable. Rinse same day!',
        price: '$75',
        link: '/services/spraytans/bridal-trial-glow'
      },
      {
        id: 'bridal-glow',
        title: 'Bridal Glow',
        description: "Our most luxurious tan, crafted for brides and special occasions. This formula gives a flawless, camera-ready glow that's soft, smooth, and radiant in every light — no orange tones, no transfer, just pure confidence. Includes our finishing powder, one complimentary add-on & Ritzy Mist undies included for instant comfort. Rinse same day!",
        price: '$85',
        link: '/services/spraytans/bridal-glow'
      },
      {
        id: 'birthday-bronze',
        title: '✨🎉 Birthday Bronze',
        description: "It's your day to glow! Celebrate yourself with our exclusive birthday spray tan with our OG solution - a rich, radiant bronze that enhances your natural tone while keeping your skin hydrated and luminous. Includes our finishing powder for that instantly dry, silky feel.",
        price: '$50',
        link: '/services/spraytans/birthday-bronze'
      }
    ],
    addOns: {
      title: 'Add-On Menu',
      description: '*Mix & match up to 3 additives max*',
      items: [
        {
          title: '✨ Scents & Shimmer — $5 each',
          description: 'Choose your glow personality with one of our luxe finishing options:',
          price: '$5'
        },
        {
          title: '💧 Skin Enhancers — $8 each',
          description: 'Targeted additives to elevate your tan and skin\'s appearance:',
          price: '$8'
        },
        {
          title: '🌿 Restore CBD Concentrate — $10',
          description: 'Soothes, calms, and hydrates skin post-tan while promoting overall balance and recovery — perfect for sensitive or dry skin types.',
          price: '$10'
        }
      ]
    }
  },
  mobile: {
    services: [
      {
        id: 'mobile-og-mist',
        title: 'OG Mist',
        description: 'Bringing everything to you! Our signature 8-hour developing formula gives a natural, hydrated bronze right from the comfort of your own space. We always finish the session off with a setting powder to make sure you\'re as comfortable as possible.',
        price: '$75',
        link: '/services/mobilespraytan/og-mist'
      },
      {
        id: 'mobile-rapid-mist',
        title: '✨ Rapid Mist',
        description: 'On-the-go glam. Achieve a golden, customizable tan in as little as 2-6 hours. This is perfect for last-minute plans or busy schedules. Every mobile service has all of the essentials to make the session go seamless. Setting powder is always included in this service.',
        price: '$90',
        link: '/services/mobilespraytan/rapid-mist'
      },
      {
        id: 'mobile-bridal-glow',
        title: 'Mobile Bridal Glow',
        description: 'Perfect for your big day or any day you want to feel your most radiant. Enjoy our premium solution, rinsing within 2-6 hrs, and powder finish from the comfort of your home, hotel, or venue. We ensure a seamless, streak-free glow designed to photograph beautifully and last through every celebration.',
        price: '$100',
        link: '/services/mobilespraytan/mobile-bridal-glow'
      }
    ],
    addOns: {
      title: 'Add-On Menu',
      description: '*Mix & match up to 3 additives max*\n(Must decide on add-ons before booking)',
      items: [
        {
          title: '✨ Scents & Shimmer — $5 each',
          description: 'Choose your glow personality with one of our luxe finishing options:',
          price: '$5'
        },
        {
          title: '💧 Skin Enhancers — $8 each',
          description: 'Targeted additives to elevate your tan and skin\'s appearance:',
          price: '$8'
        },
        {
          title: '🌿 Restore CBD Concentrate — $10',
          description: 'Soothes, calms, and hydrates skin post-tan while promoting overall balance and recovery — perfect for sensitive or dry skin types.',
          price: '$10'
        }
      ]
    }
  },
  group: {
    header: "Perfect for bridal parties, girls' nights, birthdays, and pre-vacay glow sessions!",
    items: [
      { label: 'OG Mist', value: '$60 each' },
      { label: 'Rapid Mist', value: '$75 each' }
    ],
    sections: [
      {
        title: 'Requirements:',
        content: 'Minimum of 5 guests.'
      },
      {
        title: 'Pricing:',
        content: 'Pricing can vary based on location.'
      }
    ],
    footer: {
      title: 'Ready to book your group glow?',
      content: 'To inquire or book your group glow, please email or text us directly for a custom quote.'
    }
  }
}

// Helper to create service slug from title
export const createServiceSlug = (title: string): string => {
  const serviceName = title.split('—')[0].split('—')[0].trim()
  return serviceName
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

