# ReadPlanner Build 95 stability audit

## Scope control

Build 95 modifies only EPUB list layout, transient progress-rail visibility,
Reader TOC destination handling, live pages-left calculation, preservation of
publisher styling for unresolved internal links, interface localization for the
unplanned-book overview, and removal of the page-by-page option.

No storage schema, reading-plan calculation, check-in, highlight, note, bookmark,
read-aloud, Journey, Tree, Growth Companion or Dashboard behavior was redesigned.

## Root causes

- Build 94 wrapped free-reading content in `.free-reading-chunk`, while the list
  layout selectors still required paragraphs to be direct children of
  `#reading-body`. Those rules therefore stopped applying.
- Build 94 contained an override forcing the progress rail permanently visible.
- Contents taps first navigated to the top and then launched a second paragraph
  scroll, allowing render/layout retries to race the requested destination.
- The pages-left chip used viewport geometry rather than the live paragraph and
  whole-book word position.
- Publisher links whose internal target file was absent were discarded before
  rendering, taking their red/bold/underline metadata with them.
- Several overview strings had no exact localization keys.
- The paged setting remained user-selectable despite unreliable CSS-column
  behavior on iPhone Safari.

## Automated evidence

See `BUILD-95-TEST-RESULTS.json`. JavaScript syntax, manifest parsing and exact
EPUB runtime checks passed. Final touch, safe-area and installed-PWA behavior
must be verified on the owner's iPhone.
