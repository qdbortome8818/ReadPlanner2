# ReadPlanner Build 111 - iOS Bounded PDF Renderer Audit

## Scope

Build 111 is a PDF stability-only release based on Build 110. The working user-facing PDF behavior is intentionally frozen: exact Contents/page navigation, saved reading-position resume, PDF search-to-location/highlighting, and Today/Current Reading integration are not redesigned. Core EPUB functions are likewise frozen.

## Root failure found in Build 110

The remaining iPhone failure was not explained by package size. The most important render-path problem was a feedback loop between saved zoom and PDF.js raster size:

1. Build 110 allowed PDF zoom values up to 3.2x and persisted that value.
2. Each PDF page card itself was widened to the zoom percentage.
3. `renderOnePdfOriginalPage()` and `renderOnePdfCollectionPage()` derived their PDF.js render width from `card.clientWidth`.
4. At pinch end Build 110 deliberately released and rerendered visible PDF pages. A 3.2x visual zoom therefore became a roughly 3.2x PDF.js raster-width request rather than merely a visual scale.
5. On reopen, Build 110 restored the saved zoom before the first page render. Consequently, after a zoom-related WebKit termination, reopening the same PDF could immediately recreate the same expensive raster request. This matches the reported pattern: zoom -> blank/slow page -> crash -> subsequent reopen crashes again.
6. The old scrolling renderer could also maintain/queue more than one nearby rendered page surface, compounding transient resource pressure.

This is the principal architectural change in Build 111: on iOS, visual zoom is no longer allowed to increase the PDF.js backing-raster dimensions.

## Build 111 bounded renderer

### 1. One live heavy page surface on iOS

The iOS scheduler selects the current/anchor PDF card, releases every other rendered/loading page surface, waits for cancelled/active render settlements, then renders only the selected page.

The DOM placeholders for every page remain in place. This deliberately preserves page geometry and therefore preserves the already-working exact-page, resume, and search navigation model.

### 2. Fixed base raster independent of zoom

On iOS, PDF.js renders against the reader's base viewport width rather than the zoomed card width. The iOS render profile is capped at DPR 1.1 with a 1.4M-pixel page ceiling.

A typical 390-CSS-pixel phone width therefore targets a backing width of about 429 pixels at DPR 1.1. Pinching to 2.4x does not increase that backing width.

### 3. Zoom is compositor/visual scaling on iOS

The page card still grows geometrically so horizontal/vertical scrolling and saved location semantics remain intact, but the already-rendered PDF canvas and text layer are visually scaled with CSS. Pinch-move does not release/rerender the PDF, does not capture the reading position on every movement, and does not write zoom state on every movement. Pinch-end persists once.

This is intentionally different from desktop, where the existing higher-quality rerender-on-zoom behavior remains available.

### 4. Crash-loop state is bounded

Build 110 could reopen a previously saved 3.2x PDF zoom. Build 111 clamps iOS restored zoom to 2.4x. More importantly, restored zoom no longer determines PDF.js raster dimensions on iOS, so an old high zoom cannot recreate the former oversized-render path.

### 5. PDF.js document cache barrier between bounded pages

Before a different iOS page is materialized, Build 111 waits until active page rendering has settled, then calls the PDF document cleanup path before starting the next page. It never calls document cleanup during an active render. This complements the page-level cleanup and destroy barriers introduced in Build 110.

### 6. Exact Contents/search targets retain priority

The exact-target preparation function used by Contents and PDF search now routes its materialization through the same one-page budget on iOS. The target page is rendered directly after non-target surfaces are released; the existing navigation/location functions themselves are unchanged.

### 7. No iOS preload margin

The iOS observer delegates to the bounded current-page scheduler and does not retain the former preload band. A global PDF scroll synchronization path resolves cases in which tall viewports intersect more than one placeholder: only the current anchor page is allowed to own a live rendered surface.

## Frozen behavior verification

SHA-256 extraction of named function bodies confirms that the following Build 110 functions remain byte-for-byte unchanged in Build 111:

### PDF behavior frozen
- `openPdfOriginalTarget`
- `restorePdfOriginalPosition`
- `scrollToPdfOriginalTarget`
- `openPdfSearch`
- `openPdfCollectionOriginalContents`
- `pdfOriginalPositionKey`
- `savePdfOriginalPosition`
- `markPdfTextPrecise`
- `renderPdfTextLayer`
- `readingProgressInfo`
- `renderPdfOriginal`

### EPUB behavior frozen
- `parseEpub`
- `renderEpubMediaBlock`
- `saveReadingPosition`
- `saveReadingPositionDurably`
- `navigateToDay`
- `openEpubExternalSafely`

No new duplicate named-function pattern was introduced; the only pre-existing duplicate in the scan remains `setMode`.

## Validation performed

- Inline application JavaScript: syntax PASS (`node --check`)
- Service worker JavaScript: syntax PASS
- Static/regression audit: 55/55 PASS
- Bounded-renderer exact unit checks: 10/10 PASS
- Build 110 PDF import/page cleanup lifecycle regression: 5/5 PASS
- Build 110 runtime teardown regression: 6/6 PASS
- Real-PDF bounded stress: 3/3 supplied PDFs PASS; 108 page transitions total; one simulated live page surface at a time
- Browser smoke harness: NOT RUN because this execution environment blocks local/file browser navigation by administrator policy

The real-PDF stress run validates the supplied files and the bounded raster policy under Linux tooling; it is not an emulation of Apple WebKit and cannot prove the absence of an iOS process termination.

## Acceptance criterion on the real iPhone

Build 111 should be considered successful only if normal device use survives the previously failing sequence, especially:

1. Open a PDF.
2. Pinch-zoom repeatedly.
3. Scroll between pages.
4. Use Contents to jump to arbitrary pages.
5. Use Search and open a highlighted result.
6. Leave and reopen the reader.
7. Repeat across PDFs for several minutes.
8. Confirm that a crash, if one occurs, does not create an immediate reopen crash loop.

If the same WebKit termination still occurs under Build 111, the rational next step is to remove/disable the PDF reader rather than continue destabilizing the mature EPUB application, because Build 111 already isolates PDF rendering to a deliberately minimal iOS resource budget.
