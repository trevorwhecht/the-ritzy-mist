import { Skeleton } from '@/components/ui/Skeleton'

export default function AccountSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
