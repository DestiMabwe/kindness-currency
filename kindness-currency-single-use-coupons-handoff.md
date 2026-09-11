# Kindness Currency — Single-Use Coupons: Direction & Handoff

## User Insight

Kindness Currency was originally built around coupon *sets* — themed
bundles a sender browses and customizes. Through user-perspective
exploration (persona: Naledi, the Initiator), a second, distinct need
surfaced: sometimes a sender doesn't have a range of ideas, they have
exactly *one* clear act of love they want to offer, prompted by a
specific moment (a friend's bad day, a quiet win, a rough patch).

The key distinction is NOT about time (one-off vs recurring) and NOT
about occasion/theme. It's about **range vs focus** — how many
distinct acts of love the sender is trying to express right now:

- **Focus**: I have one specific act in mind. I already know what I
  want to do.
- **Range**: I have a few different ways I could show up, and I want
  to let the recipient choose what fits.

Critically: the coupon is always the **giver's gesture** — a promise
of an act they're offering to perform, not a clever message or meme
about the moment. The moment is the *trigger*, not the *content*. This
must stay true whether it's a single coupon or a set.

Equally important: the recipient's agency in *when* they redeem is
core to the product's value. A single-gesture coupon is not the
sender dictating an act on the sender's timeline — it's an offer,
made specific, that the recipient can receive and act on whenever
they're comfortable. This nuance does not need to appear in UI copy,
but should inform tone: offers, never demands.

## Product Direction Impact

The template gallery needs to hold both single-gesture templates and
bundle-ready templates on one shelf (not two separate galleries), with
a way to help the sender find what she needs based on how she arrived
—without ever using category/product language like "single" or
"bundle."

### Gallery filters — three pills

1. **All coupons** — shows everything, no filter.
2. **One gesture, made specific** — filters to single-use coupon
   templates. For a sender who already knows the one thing she wants
   to do.
3. **Gestures, made for them** — filters to bundle-ready templates.
   For a sender who has a few ways she wants to show up, letting the
   recipient pick what fits, on their own time.

The wording matters: avoid "single," "bundle," "options," "choice," or
"pick" — those read as the recipient vetoing/selecting from a menu
rather than receiving an offer. "Made specific" and "made for them"
carry intentionality without that transactional tone.

The home page stays as-is (Create Coupon button leads to the template
gallery as before). Inside the gallery, a dismissible banner/prompt can
softly ask the sender which she's looking for and pre-filter
accordingly; the three pills remain as a manual override at all times.

## The Five Single-Use Coupon Templates

These are the first five individual (non-bundle) templates, one per
underlying emotional category. Each is a *promise of an act*, not a
themed message. Categories exist for our internal clarity only — they
should not be exposed to the user as labels.

1. **Relief** — lifting a burden.
   Working copy: "Let me carry something for you today, you choose
   what."

2. **Presence** — showing up without needing to fix anything.
   Working copy: "I'll come sit with you, we don't have to talk."

3. **Celebration** — marking a quiet win nobody else noticed.
   Working copy: "Let me take you out to celebrate, just us."

4. **Repair** — mending after distance or a mistake.
   Working copy: "Let me make this right between us, however that
   looks."

5. **Restoration** — pouring back into someone who's been giving to
   everyone but themselves. Must *acknowledge the depletion* before
   offering, not jump straight to the gesture.
   Working copy: "You've been giving so much — let me pour into you."

## Ask

Before any implementation or template-gallery changes: please draft
first-pass coupon copy for each of these five templates (title,
short supporting line, and any reveal/CTA text needed for the
card format already in use for the bundle templates). Hold off on
building the filtering logic, pills, or gallery restructuring until
the copy draft is reviewed and approved.
