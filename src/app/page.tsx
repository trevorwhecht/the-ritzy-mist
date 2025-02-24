import "./page.css"
import Image from 'next/image'
import Link from 'next/link'
import ServiceCard from '@/components/ServiceCard'
import { SectionHeader } from '@/components/SectionHeader'

export default async function Home() {
  const services = [
    {
      title: "Mobile Spray Tans",
      description: "Experience the convenience of professional spray tanning in the comfort of your own home. Our mobile service brings the salon experience to you, ensuring a flawless, natural-looking tan that enhances your natural beauty.",
      imageUrl: "https://static.wixstatic.com/media/d5800b_0b89182f72c64213b18d617d7749c4a0~mv2.jpg",
    }
  ];

  return (
    <>
      <div className="hero-section">
        <div className="hero-content text-center px-3 animate-fade-in">
          <h1 className="font-['AlegreyaSansSC'] text-6xl text-black sm:text-7xl md:text-8xl mb-2 animate-glow">The Ritzy Mist</h1>
          <h2
            className="font-['Pinyon Script'] text-3xl text-black sm:text-4xl md:text-5xl mb-8 animate-slide-up animate-glow"
            style={{ 
              marginTop: "-0.6em",
              fontFamily: "'Pinyon Script', cursive"
            }}
          >
            spray tanning
          </h2>
          <a 
            className="btn-main px-6 py-3 text-lg font-semibold"
            href="/contact"
          >
            Book Now
          </a>
        </div>
      </div>

      <div className="main-content">
        <div className="w-full h-full relative flex flex-col sm:block">
          <div className="max-w-full-content mx-auto h-full">
            <div className="pl-5 py-2 pr-5 sm:w-2/4 sm:pr-24 text-center">
              <div className="header-line my-8"></div>
              <SectionHeader>About</SectionHeader>
              <p className="text-base flex-1 leading-7 mb-4">
                Hi, I&apos;m Weslee Courtright! As a fun-loving girl&apos;s girl and driven entrepreneur, 
                I&apos;m passionate about helping others feel confident and beautiful in their own skin. 
                My journey in the beauty industry has been fueled by my love for making people feel 
                their absolute best, especially when it comes to achieving that perfect, natural-looking glow.
              </p>
              <p className="text-base flex-1 leading-7">
                I believe that everyone deserves to feel radiant and self-assured, 
                which is why I&apos;ve dedicated myself to mastering the art of spray tanning. 
                My approach combines professional expertise with a friendly, approachable style 
                that puts my clients at ease and ensures they leave feeling amazing.
              </p>
              <div className="mt-11 mb-20">
                <a href="/about-me" className="btn-main px-6 py-3 text-lg font-semibold">
                  Read More
                </a>
              </div>
            </div>
          </div>
          <div className="w-full h-[400px] sm:h-full sm:absolute sm:top-0 sm:left-2/4 sm:w-2/4">
            <div className="bg-[url('https://static.wixstatic.com/media/d5800b_c33eb05f1ec44c2d93b7d078f3ab7c3a~mv2.jpg')] h-full bg-contain bg-center sm:bg-left bg-no-repeat"></div>
          </div>
        </div>

        {/* Services Section */}
        <div className="max-w-full-content mx-auto bg-transparent">
          <div className="pl-5 py-2 pr-5">
            <div className="header-line my-8"></div>
            <div className="flex justify-center sm:justify-start lg:pl-[18%]">
              <SectionHeader>Services</SectionHeader>
            </div>
            <ServiceCard />
          </div>
        </div>
      </div>
    </>
  );
}

