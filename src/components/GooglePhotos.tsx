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
              // Tiny corner credit; pointer-events-auto opts back in past the carousel's pointer-events: none.
              <div className="absolute bottom-0 right-0 max-w-full flex items-end pr-1.5 pb-1 text-[10px] leading-tight opacity-70 text-[var(--color-foreground)] [text-shadow:0_0_3px_var(--color-background),0_0_1px_var(--color-background)] pointer-events-auto">
                {photo.attributions.map((a, i) => (
                  <span key={i} className="flex items-end">
                    {i > 0 && ', '}
                    {a.uri ? (
                      // min-h-11/min-w-11 give a 44px hit area without growing the visible label.
                      <a href={a.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-end justify-end min-h-11 min-w-11">
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
