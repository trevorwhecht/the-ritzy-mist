import "./globals.css"
import Footer from "@/components/Layout/Footer"
import NavBar from "@/components/Layout/NavBar"
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";

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
    </head>
      <body className="relative bg-black">
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
        <main className="pt-[65px]">{children}</main>
        <Footer />
      </body>
     
  </html>
  );
}
