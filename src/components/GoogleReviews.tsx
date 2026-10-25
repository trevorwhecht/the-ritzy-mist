import Image from 'next/image'
import { Star } from 'lucide-react'
import LoopCarousel from '@/components/LoopCarousel'
import { SectionHeader } from '@/components/SectionHeader'
import type { GooglePlace } from '@/lib/googlePlaces'

function Stars({ rating, size }: { rating: number; size: number }) {
  const filled = Math.round(rating)
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          aria-hidden
          className={n <= filled ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}
        />
      ))}
    </span>
  )
}

export default function GoogleReviews({ place }: { place: GooglePlace }) {
  return (
    <div className="w-full pb-20">
      <div className="max-w-full-content mx-auto pl-5 pr-5 py-2 text-center">
        <div className="header-line my-8"></div>
        <SectionHeader>Reviews</SectionHeader>
        <div>
          <a
            href={place.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-wrap items-center justify-center gap-3 min-h-11 px-3 mb-8"
          >
            <span className="text-3xl font-semibold">{place.rating.toFixed(1)}</span>
            <Stars rating={place.rating} size={24} />
            <span className="underline underline-offset-4">{place.userRatingCount.toLocaleString('en-US')} Google reviews</span>
          </a>
        </div>
      </div>
      {/* 85vw on phones, 320px cards from md up; px-2 is the gap the loop measures */}
      <LoopCarousel itemClassName="w-[85vw] md:w-80 px-2">
        {place.reviews.map((r, i) => (
          <div
            key={i}
            className="h-full flex flex-col gap-3 p-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-left"
          >
            <div className="flex items-center gap-3">
              {r.authorPhotoUri && (
                <Image src={r.authorPhotoUri} alt="" width={40} height={40} unoptimized className="w-10 h-10 rounded-full flex-shrink-0" />
              )}
              <div className="min-w-0">
                {r.authorUri ? (
                  <a href={r.authorUri} target="_blank" rel="noopener noreferrer" className="block font-semibold break-words">
                    {r.authorName}
                  </a>
                ) : (
                  <span className="block font-semibold break-words">{r.authorName}</span>
                )}
                <span className="text-sm text-[var(--color-muted)]">{r.relativeTime}</span>
              </div>
            </div>
            <Stars rating={r.rating} size={16} />
            <p className="text-base leading-7 whitespace-pre-line flex-1">{r.text}</p>
            <span className="text-sm text-[var(--color-muted)]">Posted on Google</span>
          </div>
        ))}
      </LoopCarousel>
    </div>
  )
}
