import Image from 'next/image';
import { SectionHeader } from '@/components/SectionHeader'
import { aboutParagraphs } from '@/lib/aboutData'

const bodyClass = 'text-sm flex-1 leading-7 sm:w-[calc(100%-380px)] sm:pr-6'

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
              <div className="space-y-4">
                {aboutParagraphs.map((text) => (
                  <p key={text} className={`${bodyClass} whitespace-pre-line`}>
                    {text}
                  </p>
                ))}
              </div>
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
