'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import ReorderList from './ReorderList'

interface CareListProps {
  src: string
  alt: string
  width: number
  height: number
  items: string[]
  /** Pass a handler to render the list in edit mode. Omit for read-only. */
  onChange?: (items: string[]) => void
  className?: string
}

export default function CareList({ src, alt, width, height, items, onChange, className = '' }: CareListProps) {
  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
        priority
        sizes="(max-width: 768px) 100vw, 400px"
      />

      {onChange ? (
        /* In normal flow while editing so textareas fit */
        <ReorderList
          items={items}
          onReorder={onChange}
          className="relative mt-4 space-y-2"
          rowClassName="flex items-start gap-2 rounded-2xl"
        >
          {(item, index, grip) => (
            <>
              {grip}
              <textarea
                value={item}
                onChange={(e) => onChange(items.map((it, i) => (i === index ? e.target.value : it)))}
                rows={3}
                className="flex-1 bg-white border-2 border-black rounded-2xl px-4 py-2 text-black text-xs leading-relaxed resize-y focus:outline-none focus:border-[#d59586]"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="text-red-400 hover:text-red-300 px-2 py-1 text-lg leading-none"
                aria-label={`Delete item ${index + 1}`}
              >
                ✕
              </button>
            </>
          )}
        </ReorderList>
      ) : (
        /* Overlaid on the graphic when read-only */
        <div className="absolute top-[70%] left-0 right-0 p-4 space-y-2">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border-2 border-black rounded-full px-4 py-2 text-black text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </div>
      )}

      {onChange && (
        <button
          type="button"
          onClick={() => onChange([...items, '<strong>NEW</strong> item'])}
          className="mt-2 w-full py-2 border-2 border-dashed border-gray-500 rounded-2xl text-gray-300 text-xs hover:border-[#d59586] hover:text-[#d59586] transition-colors"
        >
          + Add item
        </button>
      )}
    </div>
  )
}
