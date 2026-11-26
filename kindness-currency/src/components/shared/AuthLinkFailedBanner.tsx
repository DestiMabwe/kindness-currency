import { ctaCopy } from '@/constants/ctaCopy'

export function AuthLinkFailedBanner({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#C2185B]/25 bg-white px-4 py-3.5">
      <div className="flex flex-col gap-1 text-left">
        <span className="text-[12.5px] font-semibold text-[#1A1A2E]">{ctaCopy.authLinkFailedBannerText}</span>
        <button type="button" onClick={onRetry} className="w-fit text-[12.5px] font-semibold text-[#C2185B]">
          {ctaCopy.authLinkFailedRetryButton}
        </button>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 p-1 text-[15px] text-[#2C2C2C] opacity-50">
        ✕
      </button>
    </div>
  )
}
