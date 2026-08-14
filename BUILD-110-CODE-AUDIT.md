# ReadPlanner Build 110 code audit

## Scope freeze

Build 110 is a **PDF runtime-stability-only** release. The Build 109 navigation/resume/search behavior and the existing EPUB reader were treated as frozen surfaces.

## Concrete leak/race findings

### 1. Import-time PDF.js document leak
`parsePdf()` in Build 109 obtained a `PDFDocumentProxy` and never destroyed it. It also retained per-page PDF.js caches longer than required. Build 110 wraps the entire import in `try/finally`, cleans each `PDFPageProxy`, releases the temporary cover canvas, and awaits document destruction.

### 2. Page-proxy cache lifetime
Build 109 reset off-screen canvases but did not systematically call `PDFPageProxy.cleanup()`. Build 110 records the active page proxy on each card and cleans it after interactive layers have finished, and again defensively in cancellation/error/teardown paths.

### 3. Old/new document overlap
Build 109's `destroyPdfDocumentsAfterRenders()` deliberately added a 120 ms destroy delay. `wirePdfOriginalView()` could therefore begin a new PDF.js worker/document before the old runtime was actually gone. Build 110 serializes disposal in `_pdfRuntimeDestroyPromise`, waits full-page render settlements and thumbnail cleanup, and makes `wirePdfOriginalView()` await that barrier before loading a new document.

### 4. Thumbnail resource lifetime
Build 110 resets thumbnail canvases to 1×1 immediately on teardown, cancels the active render task, waits the thumbnail render chain, cleans the PDF document and destroys owned thumbnail documents. The `getPage()` → token-change race now has an outer `finally`, so its page proxy cannot escape cleanup.

### 5. Search/metadata temporary pages
Temporary search PDF documents and their pages are explicitly cleaned and awaited on destruction. The legacy-title first page is also cleaned.

### 6. Background suspension
When the document becomes hidden while in Original PDF view, Build 110 disconnects the page observer, cancels/reclaims rendered surfaces and asks live PDF documents to release caches. On foreground it reattaches the existing observer rather than altering saved navigation state.

## Test-PDF resource profile

The three supplied PDFs are 13, 14 and 17 pages and only about 2.2–2.8 MB compressed. A dimension/component inspection of embedded images gives a maximum per-page raw-raster estimate of about 71.7–72.2 MB and a maximum single embedded raster estimate of about 34.3 MB. These are **not measured WebKit heap figures** and images may be shared/cached internally; they are useful only to show that retaining decoded PDF page resources on iOS can be disproportionately expensive.

## Frozen behavior verification

The following Build 110 functions are byte-for-byte identical to Build 109 (SHA-256 records in `BUILD-110-STABILITY-HASHES.json`):

PDF working behavior: `openPdfOriginalTarget`, `restorePdfOriginalPosition`, `scrollToPdfOriginalTarget`, `openPdfSearch`, `openPdfCollectionOriginalContents`, `pdfOriginalPositionKey`, `savePdfOriginalPosition`, `markPdfTextPrecise`, `renderPdfTextLayer`, `readingProgressInfo`.

EPUB stable behavior: `parseEpub`, `renderEpubMediaBlock`, `saveReadingPosition`, `saveReadingPositionDurably`, `navigateToDay`, `openEpubExternalSafely`.

No new duplicate named functions were introduced.

## Limits of this test environment

The container cannot run Apple iOS WebKit or reproduce its process-memory termination heuristics. Chromium navigation smoke testing is also blocked by the environment's administrator policy. Those limitations are not counted as test failures. Syntax, exact-function lifecycle unit tests, source regression hashes and real-PDF stress tests were run locally. The definitive crash acceptance test remains the deployed iPhone PWA.
