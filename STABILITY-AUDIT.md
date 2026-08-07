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
