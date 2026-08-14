# ReadPlanner Build 109 code audit

## Incident classification

The supplied iPhone screenshot shows Safari/WebKit replacing the page with **“A problem repeatedly occurred”** for the ReadPlanner URL. This is a browser-process failure rather than the app’s ordinary caught-error UI. An iOS crash log is not available, so the OS-level termination reason cannot be stated with certainty. The Build 108 source nevertheless exposed several concrete lifecycle and memory hazards precisely on the reported **expanded PDF page thumbnail →正文 page** transition.

## Root-level findings in Build 108

### 1. Old PDF runtime was cleared too late on PDF → PDF navigation

`render()` deliberately skipped `clearPdfOriginalRuntime()` when the destination view was PDF. `app.innerHTML` was then replaced with the new PDF view, and only afterwards did `wirePdfOriginalView()` clear the old runtime. During that interval old PDF.js documents, page render work and detached canvas backing stores could coexist with the new PDF DOM. This is especially risky on iOS, where canvas/process memory is constrained.

**Build 109:** PDF runtime teardown now happens before any PDF DOM replacement. `wirePdfOriginalView()` no longer performs late teardown.

### 2. Too many full-size canvases could be alive around a navigation

Build 108 used device DPR up to 2, a `1200px` full-page observer margin, and a delayed fallback that explicitly rendered the first two pages even after the reader had been restored to another page. A full-resolution ink canvas was also allocated for every rendered page even with no ink.

For the three supplied A4 PDFs at an illustrative 390 CSS-pixel page width, one Build 108 render canvas is roughly 780×1104 RGBA pixels (~3.44 MB). With its always-full ink canvas, the backing stores alone are roughly ~6.89 MB per rendered page before PDF.js image/text caches. Build 109 caps the iOS render DPR at 1.35, uses a 360px observer margin, and leaves an empty ink layer at 1×1. The illustrative render backing store becomes roughly 527×745 (~1.57 MB). These numbers are estimates of canvas backing stores, not total WebKit memory.

### 3. Offscreen pages could finish loading after they had already left the observer window

Build 108 only released a card if it was already in `done` state. If an IntersectionObserver “leave” event occurred while the card was still `loading`, it could later finish with a large canvas and remain allocated without a second leave event.

**Build 109:** the card records viewport intent, active `PDFRenderTask` objects are cancellable, and a page that leaves while loading is released as soon as its task settles.

### 4. Thumbnail mode duplicated PDF work instead of suspending the reader

Build 108 loaded a separate PDF.js document for the thumbnail sheet while the main PDF document/canvases remained active. Thumbnail cleanup also waited for its render chain and then introduced an additional delayed document destruction, increasing overlap with the newly opened正文 page.

**Build 109:** opening the thumbnail grid first checkpoints position, disconnects the main observer, cancels/reclaims full-page canvases, then opens the thumbnail runtime. It borrows the already-loaded PDF document when the selected chapter is already mounted. Owned thumbnail documents are destroyed after their chain settles without the extra delay. Page selection waits for cleanup before continuing.

### 5. Same-chapter page selection did an unnecessary whole-app PDF rebuild

Build 108’s `openPdfOriginalTarget()` always called global `render()`, even if Page 5 already existed in the mounted chapter DOM.

**Build 109:** if the requested page card already exists, the reader resumes the main PDF renderer and navigates to that card in place. A rebuild is reserved for chapter changes or genuinely absent cards.

### 6. Today’s Reading did not understand Original-PDF-only activity

PDF collections are intentionally created with `hasPlan:false`. Build 108’s `readingProgressInfo()` treated “started” primarily as text-reader/check-in state and did not use `pdfLastPosition`; Original PDF entry also did not update the same last-opened book marker used by the regular reader. A process restart could therefore place the collection back outside Today’s Reading even though the user had been reading its PDF pages.

**Build 109:** a valid PDF resume checkpoint counts as started, PDF page position contributes progress for no-plan PDFs, and PDF entry updates `spine_last_opened_book`.

## Code cleanup / containment

- Named-function scan after repair: 591 declarations / 590 unique names. The only duplicate name remains the pre-existing `setMode` pair already present in Build 108; Build 109 introduces no new duplicate named function.
- Removed the Build 108 forced-first-two-page render behavior.
- Removed the delayed 900 ms thumbnail-document destruction overlap.
- Consolidated thumbnail cleanup into an awaitable cleanup promise.
- Kept the change concentrated in PDF runtime, PDF thumbnail lifecycle, PDF home-progress classification, and build identity.

## EPUB regression containment

The following established EPUB functions are byte-for-byte unchanged from Build 108:

- `parseEpub`
- `renderEpubMediaBlock`
- `saveReadingPosition`
- `saveReadingPositionDurably`
- `navigateToDay`
- `openEpubExternalSafely`

See `BUILD-109-EPUB-STABILITY.json` for exact hashes.

## Validation performed

`BUILD-109-TEST-RESULTS.json` contains 24/24 passing checks covering JavaScript/service-worker syntax, build/cache identity, pre-DOM PDF teardown, target-before-observer restore order, cancellation/reclamation logic, low-memory iOS profile, thumbnail suspension/cleanup, same-DOM page navigation, Today’s Reading classification, duplicate-function regression, EPUB hashes, and independent rendering of Page 5 from each of the three supplied PDFs.

## Remaining verification boundary

Real iOS WebKit process memory and its process-termination heuristics are not available in this container. This build therefore fixes the source-level overlap and memory hazards revealed by the device failure, but the definitive acceptance test remains the user’s iPhone sequence on the deployed Build 109.
