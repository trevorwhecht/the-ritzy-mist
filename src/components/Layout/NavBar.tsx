'use client'

import React from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link as NextUILink,
} from "@nextui-org/react"
import { usePathname, useRouter } from 'next/navigation'
import { Instagram } from 'lucide-react'
import NextLink from 'next/link'
import Image from 'next/image'

const NavLinks: Record<string, string> = {
  'About': "/about-me",
  'Services': "/services",
  'Pricing': "/pricing"
}

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = Object.entries(NavLinks).map(([name, href]) => ({
    name,
    href
  }))

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false)
    router.push(href)
  }

  return (
    <Navbar 
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      className="bg-black/90 text-white"
      maxWidth="full"
    >
      {/* Mobile view with 3-column layout for perfect centering */}
      <div className="w-full flex items-center sm:hidden">
        {/* Left column - menu toggle */}
        <div className="w-[60px] flex justify-start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="text-white"
          />
        </div>
        
        {/* Center column - logo */}
        <div className="flex-1 flex justify-center">
          <NavbarBrand>
            <NextUILink as={NextLink} href="/" className="font-['Pinyon Script'] text-2xl text-white">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ritzy%20Mist%20Branding%20(1)-qMybz9vMh07GWSE8i1V1TujnIkb9eB.png"
                alt="Ritzy Mist"
                width={200}
                height={50}
                className="mb-1"
              />
            </NextUILink>
          </NavbarBrand>
        </div>
        
        {/* Right column - empty space to balance the menu toggle */}
        <div className="w-[60px]"></div>
      </div>

      <NavbarMenu className="bg-black/90 pt-6">
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <NextUILink
              color="foreground"
              className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
              onClick={() => handleNavigation(item.href)}
            >
              {item.name}
            </NextUILink>
          </NavbarMenuItem>
        ))}
        
        <NavbarMenuItem>
          <NextUILink
            color="foreground"
            className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
            onClick={() => handleNavigation('/care')}
          >
            Spray Tan Care
          </NextUILink>
        </NavbarMenuItem>
        
        <NavbarMenuItem>
          <NextUILink
            color="foreground"
            className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
            onClick={() => handleNavigation('/policies')}
          >
            Policies
          </NextUILink>
        </NavbarMenuItem>
        
        <div className="w-full flex justify-center mt-auto pb-12">
          <NextUILink href="https://instagram.com/theritzymist" target="_blank" rel="noopener noreferrer">
            <Instagram className="w-6 h-6 text-white hover:text-gray-300" />
          </NextUILink>
        </div>
      </NavbarMenu>

      {/*Desktop view*/}
      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarBrand className="mr-4">
          <NextUILink as={NextLink} href="/" className="font-['Pinyon Script'] text-2xl text-white">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ritzy%20Mist%20Branding%20(1)-qMybz9vMh07GWSE8i1V1TujnIkb9eB.png"
              alt="Ritzy Mist"
              width={200}
              height={50}
              className="mb-1"
            />
          </NextUILink>
        </NavbarBrand>
        {Object.entries(NavLinks).map(([name, href]) => (
          <NavbarItem key={name} isActive={pathname === href}>
            <NextUILink 
              as={NextLink}
              href={href} 
              className={`text-white text-lg font-[AlegreyaSansSC] ${
                pathname === href 
                  ? 'text-[#d59586] font-semibold' 
                  : 'hover:text-[#d59586]'
              }`}
            >
              {name}
            </NextUILink>
          </NavbarItem>
        ))}
        <NavbarItem>
          <NextUILink href="/care" className="text-white text-lg font-[AlegreyaSansSC] hover:text-[#d59586]">
            Spray Tan Care
          </NextUILink>
        </NavbarItem>
        <NavbarItem>
          <NextUILink href="/policies" className="text-white text-lg font-[AlegreyaSansSC] hover:text-[#d59586]">
            Policies
          </NextUILink>
        </NavbarItem>
      </NavbarContent>

      {/* Social Links for desktop */}
      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>
          <NextUILink href="https://instagram.com/theritzymist" target="_blank" rel="noopener noreferrer">
            <Instagram className="w-5 h-5 text-white hover:text-[#d59586]" />
          </NextUILink>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
} 