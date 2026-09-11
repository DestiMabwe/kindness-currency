'use client'

// The one tab pattern in the system (see DESIGN.md's "Tabs (documented exception)") — pill
// buttons switching between genuinely distinct panels, not filtering one list. Originally lived
// only in Profile's Sent/Received view; AuthGate grew an independent copy of the same visual
// pattern for Sign Up/Log In, which drifted on accessibility wiring (no id/aria-controls linking
// each tab to its panel). Extracted here so there's exactly one implementation, matching
// DESIGN.md's intent that this pattern stays deliberate rather than quietly duplicating.

export type TabPillOption<T extends string> = {
  value: T
  label: string
  /** Id of this tab button — the panel it controls should set aria-labelledby to this. */
  id: string
  /** Id of the panel this tab controls — must match that panel's own id. */
  panelId: string
}

export function TabPills<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string
  options: TabPillOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          id={option.id}
          aria-selected={value === option.value}
          aria-controls={option.panelId}
          onClick={() => onChange(option.value)}
          className="rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ backgroundColor: value === option.value ? '#C2185B' : '#F0ECE4', color: value === option.value ? '#fff' : '#2C2C2C' }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
