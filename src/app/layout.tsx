import "./globals.css"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import Footer from "@/components/Layout/Footer"
import NavBar from "@/components/Layout/NavBar"
import { Providers } from "./providers"

const OG_IMAGE =
  "https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/Meta-data/RitzyMist-Landscape.jpg"

export const metadata: Metadata = {
  title: "The Ritzy Mist",
  description:
    "Professional mobile and in-studio spray tanning. Book your appointment today!",
  openGraph: {
    title: "The Ritzy Mist - Mobile Spray Tanning",
    description:
      "Professional mobile spray tanning services. Book your appointment today!",
    url: "https://theritzymist.com",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Ritzy Mist - Mobile Spray Tanning",
    description:
      "Professional mobile spray tanning services. Book your appointment today!",
    images: [OG_IMAGE],
  },
}

// viewportFit: 'cover' is what makes env(safe-area-inset-*) non-zero, which modal
// footers rely on. Zooming is deliberately NOT disabled (accessibility).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="relative bg-[var(--color-background)]">
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
        <noscript>
          {/* Tracking pixel: must be a raw <img>. next/image renders a client component,
              which cannot run inside <noscript>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=24844063038547006&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          preload="auto"
          className="fixed top-0 left-0 w-full h-full object-cover object-center"
        >
          <source
            src="https://video.wixstatic.com/video/d5800b_fa5908bc99904b088609dfb415d2c4c3/360p/mp4/file.mp4"
            type="video/mp4"
          />
        </video>
        <Providers>
          <div className="fixed top-0 left-0 right-0 z-30 bg-opacity-90 bg-[var(--color-background)]">
            <NavBar />
          </div>
          <main className="pt-16 sm:pt-[65px] min-h-dvh">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
