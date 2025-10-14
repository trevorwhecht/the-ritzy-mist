import "./globals.css"
import Footer from "@/components/Layout/Footer"
import NavBar from "@/components/Layout/NavBar"
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <head>
      <title>The Ritzy Mist</title>
      <meta name="description" content="Booking solution for a mobile spray tan business" />
      <meta 
        name="viewport" 
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" 
      />
      <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
      {/* Meta Pixel Code */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '24844063038547006');
          fbq('track', 'PageView');
        `}
      </Script>
      {/* End Meta Pixel Code */}
    </head>
      <body className="relative bg-black">
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=24844063038547006&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          webkit-playsinline="true"
          aria-hidden="true"
          preload="auto"
          className="fixed top-0 left-0 w-full h-full object-cover object-center"
         >
          <source
            src="https://video.wixstatic.com/video/d5800b_fa5908bc99904b088609dfb415d2c4c3/360p/mp4/file.mp4"
            type="video/mp4"
          />
        </video>
        <div className="fixed top-0 left-0 right-0 z-50 bg-opacity-90 bg-black">
          <NavBar />
        </div>
        <main className="pt-16 sm:pt-[65px]">{children}</main>
        <Footer />
      </body>
     
  </html>
  );
}
