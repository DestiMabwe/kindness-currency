export type CampaignBannerProps = {
  message: string
}

export function CampaignBanner({ message }: CampaignBannerProps) {
  return <div className="bg-[#C2185B] px-9 py-2.5 text-center font-sans text-[12.5px] leading-snug font-medium text-white">{message}</div>
}
