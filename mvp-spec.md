# MVP Spec: Smart Tap Card

## What it is

A wallet of digital cards on your phone. Open a card, and your phone becomes that card: anyone can tap it to open your link. Everything is managed from a simple web app and synced to the phone.

## Who it's for (MVP)

Android users who want a better way to share themselves in person. The person tapping needs no app and no account.

## How it works

1. You create cards on the web (or import your own design).
2. Cards appear in the Android app.
3. Open a card, and your phone emulates it. Someone taps, and their phone opens the card's link.
4. Go back, and the card stops sharing.

Every card has a destination link that you can change at any time.

---

## Android app

### Home
- Grid of card tiles.
- Tap a tile to expand it to the full card screen.

### Card screen
- Shows the card full-screen.
- **Opening a card starts sharing.** Pressing back stops it.
- The screen stays awake while a card is open.
- **Swipe to the back of the card**, which shows a large QR code for the same destination, as a fallback when tap doesn't work.

### Quick edit
- Change a card's destination.
- Add a card.
- Delete a card.

### Home-screen widget
- A widget for one specific card, chosen by you.
- Tapping it opens that card straight to the full card screen.

### History and deleted cards
- A history view of your cards' activity.
- Deleted cards go to a recoverable list instead of vanishing immediately.

---

## Web app

### Account
- Sign in and link your account to the Android app.

### Cards
- Add, edit, and delete cards.
- Set each card's destination link.
- Everything syncs to the app.

### Card design
- **Import your own design** (an image).
- A simple designer to build a card without outside tools.
- Designs sync to the app.

---

## Card design standard

To make designs fit the phone nicely now, and match a printed card later, every card uses one standard shape.

**Proposal: the standard bank-card size, 85.6 × 53.98 mm, a ratio of about 1.586 to 1.**

- It is the size most NFC cards are manufactured in, so the same file can become a physical card later.
- Cards are designed in landscape. On the phone, the expanded card can fill the screen rotated like a ticket, or sit centered in landscape. Pick one during design of the app.
- Suggested import size: at least 1012 × 638 px, and 2024 × 1276 px preferred, for sharp display and print.
- Provide a template with marked **safe zones** for the chip, tap icon, and QR code, so imported art doesn't clash with them on the physical version.

---

## Not in the MVP (later)

### Setup, account, and reliability

- **First-run compatibility check:** Detect whether the phone supports emulation, walk through enabling NFC, and offer a “test tap” screen.
- **Onboarding:** Route new users into the web editor or a first card on the phone so they are not staring at an empty home screen.
- **Offline behavior:** Cache card artwork on the phone. Taps still depend on the redirect server—define what recipients see when they have no signal or the server is down.
- **Account recovery:** Sign-in and sync are in MVP; add explicit recovery flows across devices.

### Speed and home screen

- **Launch straight into a default card:** Setting to open the app already expanded on your primary card (instant handoff: aim for ~2 seconds from pocket to tap). Complements the MVP home-screen widget for a specific card.
- **Card ordering and favorites:** Re-order tiles and mark favorites for context or occasion.
- **Tap confirmation and feedback:** When someone taps, show immediate visual (“Shared ✓”) and haptic feedback so you know the tap worked.

### Destinations and in-the-moment editing

- **One-shot and timed destinations:** Destinations that reset after one tap or expire after a set time (e.g. event card: conference link active for a window, then revert to default).
- **Share a link on the fly:** Android Share target from another app (e.g. chess game)—create a temporary one-shot card from that link, open it ready to tap; back out and the card disappears or resets.
- **In-app destination editing:** Update destination and rules (one-shot, timed) from the mobile app without opening the web app.

### Recipient experience and light stats

- **Recipient web page:** On tap or scan, a clean page with your info, “Save contact,” polished on iOS and Android—core web product, not just a raw redirect.
- **Recipient preview:** In the designer or app, see exactly what someone sees after tapping.
- **Light tap stats:** Tap count and last-tapped time only, kept minimal for privacy. MVP history may cover some of this; avoid duplicating a full analytics product.
- **Advanced analytics:** Usage patterns and richer insights beyond light stats.

### Design, import, and physical cards

- **Import PDF:** Upload a PDF alongside image import and the in-web designer.
- **Print-ready export:** From the web designer, export with chip, tap icon, and QR placed correctly (template safe zones).
- **Physical card pairing and management:** Order physical cards, pair to digital cards, deactivate or re-point a lost card in seconds (printed cards cannot do this as easily).

### Sharing, teams, and security

- **Share a card with a teammate or friend:** Stepping stone to team accounts and shared card management.
- **Enhanced security:** Verified taps, anti-cloning, secure usage tracking.

### Back of card and fallbacks

- **Flexible back-of-card options:** Beyond MVP’s large QR—optional note or contact details on the back.
- **Fullscreen QR mode:** For a “group moment” at a table, let everyone scan at once instead of one tap at a time. MVP already covers swipe-to-back QR when tap is unavailable.

### Platform and branding

- **Companion iPhone app:** View cards and QR-only sharing; no NFC tap emulation on iPhone.
- **Custom domain support:** Personalized domain for a professional touch.

### Real-world constraints (validate in prototyping)

- **Wallet interaction:** Foreground emulation must not collide with Google Wallet payments—needs testing on real terminals.
- **Launch speed:** Screen-on emulation means opening the app must stay fast; launch-into-default and widgets matter for access speed.

(Implementation and user feedback for these features should be confirmed during prototyping and real-world testing.)

## Success looks like

- A new user gets a working card and a first successful tap in under 10 minutes.
- The tap works reliably on the phones you test with, and a Google Wallet payment still works afterward.
- You actually reach for the app when someone asks for your details.

## Open questions

- **History:** does this mean a log of when each card was opened or tapped, a log of edits, or both?
- **Display orientation:** landscape centered, or rotated to fill the portrait screen?
- **Design tool depth:** how simple can the web designer be and still feel useful?
- **Offline:** what should the card do when the phone has no signal? (See **Offline behavior** under Not in the MVP.)
- **Launch niche and name:** still to decide.