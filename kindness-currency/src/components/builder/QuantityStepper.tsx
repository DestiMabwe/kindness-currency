'use client'

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  min = 1,
}: {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  /** Floor for disabling the decrease button. Bundle/gesture cards use the default 1 (a pre-add
   * picker can't queue less than one); the cart page passes 0 so decrementing a qty-1 line removes
   * it, matching setCartQty's own qty<=0-removes behavior. */
  min?: number
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-xl border-[1.5px] border-[#1A1A2E]/14 px-2.5 py-2">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min}
        aria-label={decreaseLabel}
        className="flex h-5 w-5 items-center justify-center text-base leading-none font-bold text-[#1A1A2E] disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[1ch] text-center text-[13px] font-bold text-[#1A1A2E]">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={increaseLabel}
        className="flex h-5 w-5 items-center justify-center text-base leading-none font-bold text-[#1A1A2E]"
      >
        +
      </button>
    </div>
  )
}
