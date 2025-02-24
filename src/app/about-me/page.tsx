import Image from 'next/image';
import { SectionHeader } from '@/components/SectionHeader'

export default function AboutMePage() {
  return (
    <div className="relative">
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <SectionHeader>About</SectionHeader>
        </div>
        <div className="w-full h-full pb-12">
          <div className="relative max-w-full-content mx-auto">
            <div
              className={`
              relative
              mx-auto
              sm:absolute
              sm:right-0
              sm:w-[319px]
              h-[319px]
              overflow-hidden
              border-white
              border-8
              max-w-[calc(100%-50px)]`}
            >
              <Image
                width={500}
                height={500}
                src="https://static.wixstatic.com/media/d5800b_c33eb05f1ec44c2d93b7d078f3ab7c3a~mv2.jpg"
                alt="my pic"
                className="object-contain w-full h-full"
              />
            </div>
            <section className="min-h-max mx-5">
              <p className="text-sm flex-1 leading-7 sm:w-[calc(100%-380px)] sm:pr-6">
                Hi, I&apos;m Weslee Courtright! As a fun-loving girl&apos;s girl and driven entrepreneur, 
                I&apos;m passionate about helping others feel confident and beautiful in their own skin. 
                My journey in the beauty industry has been fueled by my love for making people feel 
                their absolute best, especially when it comes to achieving that perfect, natural-looking glow.
              </p>
              <p>&nbsp;</p>
              <p className="text-sm flex-1 leading-7 sm:w-[calc(100%-380px)] sm:pr-6">
                I believe that everyone deserves to feel radiant and self-assured, 
                which is why I&apos;ve dedicated myself to mastering the art of spray tanning. 
                My approach combines professional expertise with a friendly, approachable style 
                that puts my clients at ease and ensures they leave feeling amazing.
              </p>
              <div className="sm:flex pb-6">
                <section className="flex-1 pt-6">
                  <h3 className="text-xl">Certifications</h3>
                  <ul className="text-sm pt-6 list-disc list-inside leading-6">
                    <li>National Spray Tanning Professional Association (NSTPA)</li>
                    <li>Sunless Certified Technician</li>
                    <li>NSTPA Course Certification</li>
                  </ul>
                </section>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 