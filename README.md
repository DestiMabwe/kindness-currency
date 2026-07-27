# Kindness Currency

A web app that transforms acts of service into beautifully designed digital coupons. Send meaningful promises — "I'll cook you a meal," "One night out on me" — as shareable gifts that recipients can redeem at their own pace, no account required.

---

## About

Digital gifts feel impersonal. Physical gifts are expensive and hard to send across distances. Kindness Currency solves this by letting you create personalized "Acts of Service" coupons and send them via a magic link. Recipients simply open the link on any device and redeem individual promises when they're ready — no app download, no signup required.

The product is built around five relational templates (Mother's Day, Valentine's, Birthday, Lovers, and Besties), each with eight pre-written, emotionally resonant coupons that you can personalize before sending.

---

## Features ✨

### Sender Experience
- 📋 **Five Gift Templates** — Browse Mother's Day, Valentine's, Birthday, Lovers, and Besties templates with visual previews
- ✏️ **Personalize Every Coupon** — Edit titles, descriptions, and fine print to match your relationship
- 🎨 **Design Controls** — Choose fonts (Playfair Display or DM Sans) and customize coupon colors via a color wheel
- ✨ **Visual Effects** — Add background effects (Confetti, Sparkle, Soft Glow) to coupon cards
- 🔐 **Secure PIN Sharing** — Generate a random 4-digit PIN that you share separately from the link (not in the URL)
- ⏰ **Optional Expiry Dates** — Set time limits on your gift sets
- 💾 **Save Drafts** — Come back and finish later without needing to log in
- 📤 **One-Tap Sharing** — Share via WhatsApp, copy link, or use Web Share API

### Recipient Experience
- 🎁 **Zero Friction** — Open the magic link on any device; no download or account needed
- 👋 **Personal Greeting** — See a warm message from the sender
- 🧧 **Beautiful Browsing** — Scroll through all eight coupons in a gorgeous mobile-first layout
- ♥️ **Redeem at Your Pace** — Tap "Redeem This ♥" whenever you're ready to use a coupon
- 🛡️ **PIN Verification** — Verify your identity with the 4-digit PIN
- ✅ **Redemption Tracking** — Redeemed coupons move to the bottom with a "Redeemed ♥" stamp
- 🚀 **Become a Creator** — Soft CTA to create your own gift set at the bottom of the page

### Premium Design System
- Warm, playful, intimate visual language
- Mobile-first responsive design (optimized for 390px)
- Consistent use of Kindness Red (#C2185B), Cream (#FFF8F0), and custom typography
- Premium coupon card design with scalloped edges, decorative barcodes, and template-specific motifs

---

## Project Status 🚀

**MVP Phase:** Core architecture, database schema, and authentication system are in place.

**Current Work:** Polishing and iterating on the frontend UI/UX, ensuring all components meet the design system standards before moving to backend hardening and advanced security implementations.

**Upcoming:**
- [ ] Frontend component refinement and user testing
- [ ] Backend API optimization and error handling
- [ ] Security audit (PIN verification, email OTP flow)
- [ ] Performance optimization
- [ ] Deployment and launch prep

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RealtimeDB)
- **Deployment:** Vercel
- **UI Libraries:** Shadcn/ui, custom component library
- **Authentication:** Supabase Email OTP (magic links, no passwords)

# Run the development server
npm run dev
