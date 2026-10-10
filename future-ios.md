# Future iPhone app

A companion iPhone app fits this architecture as another client. It is a SwiftUI app with the Clerk iOS SDK, the same card API, and PostHog’s iOS SDK. Its feature set is the one already named in the spec: view cards, edit the destination, show the QR full screen, and a home-screen widget that opens that QR. Recipients still need no app. The short link, the PNG, and the Clerk user id are the whole contract.

NFC host card emulation stays on Android. Apple treats card emulation as a restricted entitlement, and a normal App Store app does not get to emulate an NDEF URL tag (AID `D2760000850101`). The iPhone product shares by QR. If Apple later grants that AID, the payload is the same URI record the Android service already builds. Until then, the iOS card screen fulfills “make this short link available” with the QR and the system share sheet.

What we lock now so that app stays small:

- The API, artwork, and public URL have no HCE fields.
- Sharing is “present this short link,” with Android adding emulation beside the QR.
- Auth and analytics already have iOS SDKs.
- Local storage stays per platform (Room on Android, a separate cache on iOS). There is no shared mobile codebase to extract first.

See [ARCHITECTURE.md](ARCHITECTURE.md).
