const BASE = "https://theritzymist.com"

// Facts come from the site's own pages (Footer, NavBar, ServiceCard). No ratings or reviews on purpose.
const OFFERS = [
  ["Spray Tan", "Spray tan in the studio. Starting at $55"],
  ["Mobile Spray Tan", "Spray tan in the comfort of your own home. Starting at $75"],
  ["Group Spray Tan", "For bridal parties, special events and groups. Starting at $300 (minimum 5 people)"],
]

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "BeautySalon"],
  name: "The Ritzy Mist",
  url: BASE,
  logo: `${BASE}/icon.png`,
  telephone: "+1-916-628-4899",
  email: "theritzymist@gmail.com",
  areaServed: "San Diego County",
  description:
    "Mobile spray tans brought to your home. Clean ingredients, custom shades, rapid-rinse.",
  makesOffer: OFFERS.map(([name, description]) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name, description },
  })),
  sameAs: ["https://instagram.com/theritzymist"],
}
