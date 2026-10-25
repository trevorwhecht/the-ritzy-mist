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
  Link as HeroLink,
} from "@heroui/react"
import { usePathname, useRouter } from 'next/navigation'
import { Instagram, UserRound, X } from 'lucide-react'
import NextLink from 'next/link'
import Image from 'next/image'
import { useAuthModal } from '@/contexts/AuthModalContext'
import AccountMenu from '@/components/accountMenu/accountMenu'

const NavLinks: Record<string, string> = {
  'About': "/about-me",
  'Services': "/services",
  'Pricing': "/pricing",
  'Book Now': "/services/spraytans"
}

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthModal()

  const accountButton = (
    <button
      aria-label={isAuthModalOpen ? 'Close account menu' : 'Open account menu'}
      onClick={() => (isAuthModalOpen ? closeAuthModal() : openAuthModal())}
      className="min-w-11 min-h-11 touch-manipulation flex items-center justify-center text-[var(--color-foreground)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none rounded"
    >
      {isAuthModalOpen ? <X className="w-6 h-6" aria-hidden /> : <UserRound className="w-6 h-6" aria-hidden />}
    </button>
  )

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
      className="bg-black/90 text-white sm:h-auto h-16"
      maxWidth="full"
    >
      {/* Mobile view with 3-column layout for perfect centering */}
      <div className="w-full flex items-center sm:hidden h-16">
        {/* Left column - logo */}
        <div className="w-[200px] flex justify-start -ml-4">
          <NavbarBrand>
            <HeroLink as={NextLink} href="/" className="font-['Pinyon Script'] text-2xl text-white">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ritzy%20Mist%20Branding%20(1)-qMybz9vMh07GWSE8i1V1TujnIkb9eB.png"
                alt="Ritzy Mist"
                width={200}
                height={50}
                className="mb-1"
              />
            </HeroLink>
          </NavbarBrand>
        </div>
        
        {/* Center column - empty space to balance the layout */}
        <div className="flex-1"></div>
        
        {/* Right column - account + menu toggle */}
        <div className="w-[100px] flex justify-end items-center">
          {accountButton}
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="text-white p-2 min-w-[44px] min-h-[44px]"
          />
        </div>
      </div>

      <NavbarMenu className="bg-black/90 pt-6">
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <HeroLink
              color="foreground"
              className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
              onPress={() => handleNavigation(item.href)}
            >
              {item.name}
            </HeroLink>
          </NavbarMenuItem>
        ))}
        
        <NavbarMenuItem>
          <HeroLink
            color="foreground"
            className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
            onPress={() => handleNavigation('/spraytancare')}
          >
            Spray Tan Care
          </HeroLink>
        </NavbarMenuItem>
        
        <NavbarMenuItem>
          <HeroLink
            color="foreground"
            className="w-full text-white hover:text-[#d59586] text-2xl py-2 font-[AlegreyaSansSC]"
            onPress={() => handleNavigation('/policies')}
          >
            Policies
          </HeroLink>
        </NavbarMenuItem>
        
        <div className="w-full flex justify-center mt-auto pb-12">
          <HeroLink href="https://instagram.com/theritzymist" target="_blank" rel="noopener noreferrer">
            <Instagram className="w-6 h-6 text-white hover:text-gray-300" />
          </HeroLink>
        </div>
      </NavbarMenu>

      {/*Desktop view*/}
      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarBrand className="mr-4">
          <HeroLink as={NextLink} href="/" className="font-['Pinyon Script'] text-2xl text-white">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ritzy%20Mist%20Branding%20(1)-qMybz9vMh07GWSE8i1V1TujnIkb9eB.png"
              alt="Ritzy Mist"
              width={200}
              height={50}
              className="mb-1"
            />
          </HeroLink>
        </NavbarBrand>
        {Object.entries(NavLinks).map(([name, href]) => (
          <NavbarItem key={name} isActive={pathname === href}>
            <HeroLink 
              as={NextLink}
              href={href} 
              className={`text-white text-lg font-[AlegreyaSansSC] ${
                pathname === href 
                  ? 'text-[#d59586] font-semibold' 
                  : 'hover:text-[#d59586]'
              }`}
            >
              {name}
            </HeroLink>
          </NavbarItem>
        ))}
        <NavbarItem>
          <HeroLink href="/spraytancare" className="text-white text-lg font-[AlegreyaSansSC] hover:text-[#d59586]">
            Spray Tan Care
          </HeroLink>
        </NavbarItem>
        <NavbarItem>
          <HeroLink href="/policies" className="text-white text-lg font-[AlegreyaSansSC] hover:text-[#d59586]">
            Policies
          </HeroLink>
        </NavbarItem>
      </NavbarContent>

      {/* Social Links for desktop */}
      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>{accountButton}</NavbarItem>
        <NavbarItem>
          <HeroLink href="https://instagram.com/theritzymist" target="_blank" rel="noopener noreferrer">
            <Instagram className="w-5 h-5 text-white hover:text-[#d59586]" />
          </HeroLink>
        </NavbarItem>
      </NavbarContent>

      <AccountMenu isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </Navbar>
  )
} 