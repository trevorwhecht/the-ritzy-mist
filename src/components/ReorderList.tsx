'use client'

import { useState, ReactNode } from 'react'

interface ReorderListProps<T> {
  items: T[]
  onReorder: (items: T[]) => void
  /** Render one row. `grip` is the drag handle — drop it anywhere inside the row. */
  children: (item: T, index: number, grip: ReactNode) => ReactNode
  className?: string
  rowClassName?: string
}

export default function ReorderList<T>({
  items,
  onReorder,
  children,
  className = '',
  rowClassName = '',
}: ReorderListProps<T>) {
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  // Rows are only draggable while the grip is held, so inputs stay selectable
  const [gripHeld, setGripHeld] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  const endDrag = () => {
    setDragFrom(null)
    setDragOver(null)
    setGripHeld(null)
  }

  const grip = (index: number) => (
    <button
      type="button"
      onMouseDown={() => setGripHeld(index)}
      onMouseUp={() => setGripHeld(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          move(index, index - 1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          move(index, index + 1)
        }
      }}
      className="cursor-grab active:cursor-grabbing select-none text-gray-400 hover:text-[#d59586] px-1 py-2 text-lg leading-none"
      aria-label={`Reorder item ${index + 1} — drag, or focus and use arrow keys`}
      title="Drag to reorder (or focus + ↑/↓)"
    >
      ⠿
    </button>
  )

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          draggable={gripHeld === index}
          onDragStart={() => setDragFrom(index)}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(index)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragFrom !== null) move(dragFrom, index)
            endDrag()
          }}
          onDragEnd={endDrag}
          className={`${rowClassName} transition-opacity ${dragFrom === index ? 'opacity-40' : ''} ${
            dragOver === index && dragFrom !== null && dragFrom !== index ? 'ring-2 ring-[#d59586]' : ''
          }`}
        >
          {children(item, index, grip(index))}
        </div>
      ))}
    </div>
  )
}
