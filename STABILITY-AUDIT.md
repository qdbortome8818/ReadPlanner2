# ReadPlanner Build 96 stability audit

## Scope control

Build 96 modifies only:

- continuous free-reading whole-book progress measurement;
- shared EPUB TOC target resolution and parent-title interaction;
- intentional-tap protection for library book cards.

No storage schema, import workflow, reading-plan calculation, check-in,
highlight, note, bookmark, read-aloud, typography, Journey, Tree, Growth
Companion or Dashboard behaviour was redesigned.

## Root causes

- Build 95 translated a word-weighted location into a fixed 260-words-per-page
  estimate. That number could not match the actual rendered page count after
  font, margin, image and viewport changes, and could therefore remain non-zero
  at the visible end of a book.
- The opening publisher TOC and Reader Contents used separate navigation paths.
  Opening-page links performed a top navigation followed by a second scroll,
  while parent rows in Reader Contents used their entire tap area only to expand.
  In addition, structural EPUB parent entries without an independent href could
  be mapped to paragraph zero.
- Library cards trusted the browser's synthesized click. On touch devices, very
  slight contact during a scroll or swipe could occasionally produce an open
  action.

## Containment and maintainability

- Physical progress is centralized in `viewportMeasuredBookProgress`; the
  visible `.free-reading-end` marker is the authoritative 100% boundary.
- TOC mapping, cached runtime entries and shared target selection are separated
  into `mapOriginalTocToChunks`, `originalTocEntries` and
  `resolveBookTocTarget`.
- Parent disclosure is isolated to the chevron; title navigation remains one
  atomic target transaction.
- Book-card press/move/release validation is isolated from the main action
  dispatcher.

## Automated evidence

See `BUILD-96-TEST-RESULTS.json`. JavaScript syntax, manifest parsing, service
worker build identity, exact Economist TOC resolution, physical progress and
card gesture tests passed. Final safe-area and iPhone Safari touch behaviour
must be verified on the owner's device.

## Build 97 scoped audit

Build 97 changes only whole-book viewport progress geometry and AA reading
controls/themes. The Build 96 shared TOC resolver and deliberate library-card
opening gate were inspected but not modified. EPUB import/parsing, planned-day
segmentation, highlights, notes, bookmarks, speech, vocabulary, check-ins,
Journey, Reading Tree, Growth Companion and Dashboard code paths are outside the
Build 97 diff.

For future maintenance, AA range limits now live in `READER_SETTING_LIMITS`, and
whole-book physical progress remains isolated in `viewportMeasuredBookProgress`.

## Build 104 PDF reliability containment

Build 104 changes only PDF import/collection routing and the original-PDF
runtime. EPUB parsing, EPUB rendering, EPUB TOC mapping, reading-position
storage/restoration, planned navigation and EPUB read-aloud controllers are
byte-for-byte unchanged from Build 103.

- PDF speech uses its own session token, visible Stop control and temporary
  text-layer cues; leaving or backgrounding the PDF invalidates callbacks.
- Initial PDF zoom setup cannot write a page-1 checkpoint before restoration.
- PDF restore retries have a token, so a late retry or overview scroll cannot
  override an explicit search/thumbnail destination.
- Thumbnail canvases render lazily in one bounded queue and are destroyed when
  the sheet closes, limiting iPhone memory pressure.
- Ink erasing uses point-to-segment geometry and deletes the intersected vector
  stroke instead of painting a translucent stroke over it.
- Single and batch PDF imports both route into a new or existing PDF collection;
  no new PDF exposes a separate Reading text entry.


## Build 101 targeted additions
- PDF import regression fixed: `pdfPageSizes` now returns the collected `pageSizes` array.
- IndexedDB schema upgraded from 3 to 4 only to add `pdfSources`, an isolated store for PDF-collection chapter source blobs. Existing stores are unchanged.
- PDF Collections are additive virtual-book records. EPUB book records and EPUB parsing code are not migrated or rewritten.
- Collection chapter deletion remaps only that collection's check-ins/highlights/bookmarks/vocabulary and clears its resume checkpoints to avoid stale coordinates.
- Original PDF collection pages are lazy-rendered from locally stored source PDFs; PDF files are not bundled into the deployed app.
- Reading Tree is suppressed only for `PDF Collection` books.
- Vocabulary context review changes presentation/navigation only; saved vocabulary schema remains backward compatible.
- Storage manager reports browser-origin estimate plus known source-file sizes and reuses the existing book deletion path.

## Build 108 PDF navigation transaction repair

Build 108 is constrained to PDF original-view navigation/persistence, PDF render teardown, thumbnail cleanup, and PWA build identity. The stable EPUB functions listed in `BUILD-108-EPUB-STABILITY.json` are unchanged from the supplied Build 107 source.

The important architectural change is that a PDF destination is now a transaction rather than a best-effort scroll. A requested collection chapter/page is committed before render and remains authoritative until the matching page card is actually visible. Lifecycle checkpointing cannot force-sample a transient Page 1 over that transaction. Per-chapter positions are mirrored into the book record, and old PDF.js documents wait for active full-page renders to settle before destruction.

## Build 109 iOS PDF stability repair

The device-reported Safari/WebKit “A problem repeatedly occurred” failure exposed a PDF process-stability class that the Build 108 stubbed-canvas browser harness could not exercise. Build 109 moves PDF teardown before DOM replacement, adds render-task cancellation and offscreen reclamation, applies a conservative iOS canvas profile, suspends full-page rendering behind thumbnail sheets, removes thumbnail-document overlap, uses same-DOM navigation when possible, and includes Original-PDF positions in current-reading classification. See `BUILD-109-CODE-AUDIT.md` and `BUILD-109-TEST-RESULTS.json`.
