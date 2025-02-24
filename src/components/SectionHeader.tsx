'use client'
import { cn } from "@/lib/utils"
import type React from "react"

interface SectionHeaderProps {
  children: React.ReactNode
  className?: string
  size?: "large" | "small"
}

export function SectionHeader({ children, className, size = "large" }: SectionHeaderProps) {
  return (
    <div className="relative inline-block mb-12">
      <h2
        className={cn(
          "font-['AlegreyaSansSC'] text-white tracking-tighter",
          size === "large" ? "text-6xl" : "text-3xl",
          className,
        )}
      >
        {children}
      </h2>
      <div 
        className={cn(
          "absolute left-0 right-[-20%]",
          "bg-[#d59586]",
          size === "large" ? "h-2" : "h-1 -bottom-1",
        )}
      />
    </div>
  )
} 