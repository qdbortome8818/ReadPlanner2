# ReadPlanner Build 108 code audit

## Scope and containment

The repair is deliberately concentrated in the PDF original-view subsystem, PDF lifecycle persistence, thumbnail-sheet cleanup, and PWA build identity. The diff against the supplied Build 107 `index.html` is 74 insertions and 54 deletions; no broad application rewrite was performed.

## PDF code categories reviewed

- **Position model:** overall PDF resume, per-collection-chapter resume, within-page anchor, zoom.
- **Navigation:** Contents article selection, page-thumbnail selection, search/page destinations, chapter switching, reopen/resume.
- **Lifecycle:** explicit reader exit, visibility hidden, `pagehide`, `beforeunload`.
- **Rendering:** collection/standalone page render, old-document teardown, target-card preparation.
- **Thumbnail runtime:** grid open/back/close/page-selection teardown.
- **PWA identity:** index build number, service-worker cache version, manifest cache-buster.

## Defects / redundancy removed

1. Delayed forced PDF save that could demote an explicit Page-N destination to Page 1.
2. Duplicate forced PDF lifecycle checkpoint handlers.
3. Double thumbnail-runtime invalidation on Page/Close/Back flows.
4. Fixed-delay PDF.js document destruction while renders could still be active.
5. LocalStorage-only per-chapter resume fallback.
6. Stale internal Build 106 marker inside the Build 107 package.
7. Unused PDF-only `currentPdfOriginalPage()` helper.

## Dead-code scan

A named-function reference scan found 582 declarations (581 unique names) after the repair and nine single-reference candidates. Only the clearly unused PDF-only helper was removed. The remaining candidates belong to compatibility or non-PDF feature areas and were intentionally left untouched rather than risk destabilizing established behavior.

## Stable EPUB containment

The following established EPUB functions compare unchanged against the supplied Build 107 source:

- `parseEpub`
- `renderEpubMediaBlock`
- `saveReadingPosition`
- `saveReadingPositionDurably`
- `navigateToDay`
- `openEpubExternalSafely`

See `BUILD-108-EPUB-STABILITY.json` for hashes.

## Test evidence

See `BUILD-108-TEST-RESULTS.json`. The browser suite passed 26/26 assertions with no uncaught browser/page errors. The three supplied PDFs were also opened independently, their page counts/sizes verified, and Page 5 of each rendered successfully before those dimensions were used in the navigation harness.
