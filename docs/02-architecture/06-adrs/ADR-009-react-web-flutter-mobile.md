# ADR-ARCH-009 — React Web and Flutter Mobile Clients

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-009` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 28 August 2026 |
| Decision scope | Web/mobile client technologies, shared contracts, mobile-first delivery, native integration, and release testing |
| Decision owners | Product owner, design, architecture, web/mobile engineering, security, and quality |
| Supersedes | `DEC-021` and the native-wrapper/later-delivery consequence in `ADR-ARCH-006` |

## Context

The React/TypeScript public website and web vault already exist. The product owner has clarified that mobile users are primary and selected Flutter for dedicated iOS and Android applications. Flutter cannot directly reuse React components, so the architecture must share contracts and semantics without falsely claiming UI-source reuse.

## Decision drivers and traceability

- Decisions: `DEC-021` (superseded), `DEC-043`–`048`, `DEC-050`–`052`, `DEC-054`.
- Requirements: all Phase 1 journeys plus `REQ-P1-TRUST-001`–`009` and accessibility requirements.
- Architecture/engineering: `ADR-ARCH-005`–`008`, `ENG-STACK-001`, `ENG-REP-001`, `ENG-TST-001`.

## Decision

### 1. Client responsibilities

- React/TypeScript remains the public marketing website and accessible authenticated web application/PWA.
- Flutter/Dart provides the primary dedicated iOS and Android applications from one mobile codebase.
- The NestJS API and provider-neutral domain/application services remain the shared server boundary.
- Native Swift/Kotlin is introduced only behind a Flutter plugin/platform-channel interface when secure key storage, capture, background execution, or another required OS capability cannot be safely satisfied by a maintained Flutter package.

### 2. Shared assets and contracts

OpenAPI, event schemas, encryption envelopes, reference-data IDs, authorization capabilities, error codes, state machines, design tokens where representable, synthetic fixtures, and conformance scenarios remain authoritative repository assets. CI generates or validates TypeScript and Dart clients/models from those contracts.

Business rules that protect authorization, evidence, deletion, key access, or workflow truth remain server/domain authoritative and are not independently reinterpreted by either UI. Client-side encryption and local intelligence use cross-platform test vectors and equivalent policy inputs.

### 3. Mobile-first experience

Flutter designs start with capture, scan/import, secure unlock, document viewing, household hierarchy, extracted profile, relationship graph, search/Q&A, family access, activity, Trash/recovery, notifications, and offline/degraded states for handheld use. Tablet layouts are adaptive rather than enlarged phone screens.

Only encrypted content may persist offline. Keys use OS-protected storage and screenshots/app-switcher previews are restricted on sensitive routes where platform policy permits.

### 4. Delivery

Web releases deploy to Azure. iOS uses an Xcode-generated Flutter host, signed builds, TestFlight, and App Store Connect. Android uses signed Android App Bundles, Play internal/closed testing, and Play production tracks. Store publication remains gated by owner-controlled developer accounts and release evidence.

## Explicit non-decisions

This ADR does not rewrite the marketing website in Flutter, share React UI widgets with Flutter, select store account ownership, or guarantee identical platform presentation. Functional/security contracts are equivalent; navigation and interaction may follow each platform's conventions.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| React plus Capacitor | Maximum current UI reuse | Mobile is the primary product and the owner prefers a dedicated mobile-first Flutter experience. |
| Fully native Swift and Kotlin | Maximum platform control | Two mobile implementations increase cost and behavior drift. |
| Flutter for web and mobile | One application UI stack | Rewrites completed React work and is less suitable for the text-rich public website; two stacks remain because the public site still needs a document-centric web experience. |
| React Native mobile | TypeScript familiarity | Still requires a separate mobile UI and was not selected by the product owner. |

## Consequences

- Mobile receives a first-class adaptive experience and one iOS/Android implementation.
- React and Flutter create two UI codebases; drift is controlled through generated contracts, shared fixtures, design tokens, and cross-client conformance tests.
- Mobile developers/tooling must support Dart, Xcode, Android SDK, signing, and store review.

## Validation before release

1. Every critical journey has web, iOS, and Android conformance coverage or an explicit platform exception.
2. Generated TypeScript/Dart clients match the same OpenAPI and error contracts.
3. Encryption test vectors and authorized-result sets are identical across clients.
4. OWASP ASVS web/API and MASVS/MASTG mobile controls pass with accessibility and device-matrix evidence.
5. TestFlight and Play closed-test builds use the same staged API release that passed the web gate.

## Open-decision fences

Apple/Google developer accounts, bundle/package identifiers, production signing, push credentials, store privacy declarations, and production publication remain owner/release inputs under `DEC-054`.

## Revisit and supersession triggers

Revisit if contract drift becomes unmanageable, Flutter cannot meet a critical accessibility/security/platform requirement, store policy changes, or validated product usage makes another client primary.
