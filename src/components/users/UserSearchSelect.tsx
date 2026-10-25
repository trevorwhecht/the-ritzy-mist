'use client'
import { useEffect, useMemo, useState } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'

export interface PickableUser {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  isGuest?: boolean
}

/**
 * Guest vs registered-account indicator. Use this everywhere users are listed — the two are
 * easy to confuse and behave differently (a guest has no login, and guest matching is a phone
 * heuristic), so picking the wrong one attaches an appointment to the wrong person.
 */
export function UserTypeBadge({ isGuest, className = '' }: { isGuest?: boolean | null; className?: string }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-surface)] ${
        isGuest ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'
      } ${className}`}
    >
      {isGuest ? 'Guest' : 'Account'}
    </span>
  )
}

export const userDisplayName = (u: PickableUser): string =>
  [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || u.phone || 'Unnamed user'

interface UserSearchSelectProps {
  onSelect: (user: PickableUser | null) => void
  label?: string
  placeholder?: string
  /** Preloaded list; when omitted the component fetches /api/users/all itself (admin only). */
  users?: PickableUser[]
}

/** Searchable user picker (name / email / phone) that shows whether each result is a guest. */
export default function UserSearchSelect({
  onSelect,
  label = 'Search previous users',
  placeholder = 'Name, email, or phone',
  users,
}: UserSearchSelectProps) {
  const [fetched, setFetched] = useState<PickableUser[]>([])
  const [isLoading, setIsLoading] = useState(!users)
  // The listbox popover portals to document.body by default. Inside a Modal that puts it
  // OUTSIDE the modal's DOM, so the modal's interact-outside handler cancels the option's
  // pointerdown — React Aria never opens a press session, `onSelectionChange` never fires,
  // and the click silently does nothing. Portalling into this wrapper keeps it inside.
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (users) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/users/all')
        const data = await res.json()
        if (!cancelled && data.success) setFetched(data.users || [])
      } catch (error) {
        console.error('[UserSearchSelect] Failed to load users:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [users])

  const list = users ?? fetched

  // Accounts first, then guests, alphabetical within each group — keeps the two kinds
  // visually separated in the scroll instead of interleaved.
  const sorted = useMemo(
    () =>
      [...list].sort(
        (a, b) =>
          Number(!!a.isGuest) - Number(!!b.isGuest) || userDisplayName(a).localeCompare(userDisplayName(b))
      ),
    [list]
  )

  return (
    <div ref={setPortalContainer}>
      <Autocomplete
        label={label}
        placeholder={placeholder}
        isLoading={isLoading}
        variant="bordered"
        inputProps={{ classNames: { input: 'text-base' } }}
        defaultItems={sorted}
        popoverProps={{ portalContainer: portalContainer ?? undefined }}
        onSelectionChange={(key) => {
          if (key == null) return onSelect(null)
          const match = sorted.find((u) => u.id === String(key))
          // A key with no matching row means the collection and `sorted` disagree — the
          // caller would otherwise drop the click with no trace at all.
          if (!match) console.error('[UserSearchSelect] Selected key matched no user:', key, sorted.length)
          onSelect(match || null)
        }}
        className="text-[var(--color-foreground)]"
        listboxProps={{ emptyContent: 'No matching users' }}
      >
        {(user: PickableUser) => (
          // textValue drives the type-ahead filter, so email and phone are searchable too.
          <AutocompleteItem
            key={user.id}
            textValue={`${userDisplayName(user)} ${user.email ?? ''} ${user.phone ?? ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{userDisplayName(user)}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  {user.email || user.phone || 'No contact info'}
                </p>
              </div>
              <UserTypeBadge isGuest={user.isGuest} />
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  )
}
