const Bar = ({ className = '' }: { className?: string }) => (
  <div className={`rounded bg-white/10 ${className}`} />
)

/** Loading placeholder shaped like the pricing tabs panel. Shared by PricingTabs and EditablePricingTabs. */
export default function PricingTabsSkeleton({
  rows = 4,
  className = ''
}: {
  rows?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Loading pricing"
      className={`text-white animate-pulse ${className}`}
    >
      {/* Folder-style tabs */}
      <div className="relative mb-0 max-w-4xl mx-auto">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 px-2 md:px-6 py-3 rounded-t-lg border-2 border-white ${
                i === 0 ? 'bg-stone-800' : 'bg-black'
              }`}
            >
              <Bar className="h-4 md:h-5 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Panel */}
      <div className="bg-black/50 border border-white rounded-b-lg p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="border-b border-gray-600 pb-4">
              {/* title — price */}
              <Bar className="h-7 w-3/4 mb-3" />
              {/* description */}
              <Bar className="h-4 w-full mb-2" />
              <Bar className="h-4 w-5/6" />
            </div>
          ))}
        </div>

        {/* Add-Ons */}
        <div className="mt-8 space-y-4">
          <Bar className="h-7 w-1/2" />
          <div>
            <Bar className="h-5 w-1/3 mb-2" />
            <Bar className="h-4 w-full" />
          </div>
          <div>
            <Bar className="h-5 w-2/5 mb-2" />
            <Bar className="h-4 w-11/12" />
          </div>
        </div>
      </div>
    </div>
  )
}
