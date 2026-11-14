import type { MetadataRoute } from "next"

const BASE = "https://theritzymist.com"
const PATHS = ["", "/about-me", "/services", "/pricing", "/care", "/spraytancare", "/contact", "/policies"]

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `${BASE}${p}` }))
}
