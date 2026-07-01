// Phase 1 only. Flip to true only when a feature is explicitly approved beyond PRD Phase 1 scope.
export const flags = {
  animatedCouponReveals: false, // Phase 2
  scheduledDelivery: false, // Phase 2
  watermarkRemoval: false, // Phase 2
  corporateTier: false, // Phase 3
  bulkCreation: false, // Phase 3
  customBranding: false, // Phase 3
  analyticsDashboard: false, // Phase 3
} as const
