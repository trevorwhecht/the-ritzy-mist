import Image from 'next/image'
import LoopCarousel from '@/components/LoopCarousel'
import type { GooglePhoto } from '@/lib/googlePlaces'

export default function GooglePhotos({ photos }: { photos: GooglePhoto[] }) {
  return (
    <div className="w-full pt-8 pb-20">
      {/* Same cell size as onewitharts PrintPortfolio: 85vw square on phones, 300px tall from md up */}
      <LoopCarousel itemClassName="relative w-[85vw] h-[85vw] md:w-[400px] md:h-[300px] overflow-hidden bg-[var(--color-surface)]">
        {photos.map((photo) => (
          <div key={photo.name} className="w-full h-full">
            <Image
              src={`/api/google-photo?name=${encodeURIComponent(photo.name)}`}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 768px) 400px, 85vw"
              className="object-cover"
            />
            {photo.attributions.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-sm bg-[color-mix(in_srgb,var(--color-background)_60%,transparent)]">
                {photo.attributions.map((a, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {a.uri ? (
                      <a href={a.uri} target="_blank" rel="noopener noreferrer">
                        {a.displayName}
                      </a>
                    ) : (
                      a.displayName
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </LoopCarousel>
    </div>
  )
}
