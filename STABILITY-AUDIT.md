# ReadPlanner Build 94 — Multi-EPUB Stability Audit

## Scope control

Build 94 changes only the reported import, EPUB parsing, Reader TOC, free-reading,
position, pagination, progress-rail, font-size and AA-slider paths. Planned-reading,
highlighting, notes, bookmarks, speech, Journey, Tree, Growth Companion,
Dashboard and check-in systems were retained and regression-tested.

## Exact EPUB corpus

| EPUB | Words | Internal chunks | Publisher TOC entries | Media blocks |
|---|---:|---:|---:|---:|
| The Sea | 62,015 | 14 | 12 | 4 |
| Dracula | 195,703 | 44 | 43 | 2 |
| The Atlantic 2026-02-02 | 32,911 | 8 | 20 | 85 |
| The New Yorker 2026-06-29 | 59,160 | 14 | 30 | 77 |
| Nature 2026-08-01 | 277,439 | 62 | 43 | 285 |
| The Economist 2026-08-01 | 64,033 | 15 | 92 | 199 |

## Confirmed root causes

### Zero-height virtual sections
Rendered virtual sections inherited layout containment. In long EPUBs this could
make their measured height collapse to zero, overlap neighbouring sections and
produce incorrect chapter destinations or resume points. Rendered sections now use
normal document layout; containment is limited to unrendered fixed-height
placeholders.

### Duplicate labels in magazine navigation
A short title such as “Business” can occur in the cover contents, a section menu and
an article heading. Mapping by text alone could spread metadata to every occurrence
or choose the wrong destination. Build 94 preserves source word offsets and maps an
exact duplicate to its nearest original occurrence.

### Whole-book CSS pagination
Turning an entire large magazine into one CSS multicolumn element could stall the
main thread and make swipes unresponsive. Free Page-by-page mode now paginates one
internal section at a time and carries swipes across section boundaries.

### Import-path blocking
Media decoding and source-Blob persistence competed with the import confirmation
and first Reader render. Media is now lazy-loaded and source-file persistence is
serialized at lower priority.

## Runtime results

- Duplicate import: Cancel retained one copy; Confirm produced a deliberate second
  copy. PASS.
- Unfinished import: Confirm stored the book without a plan; Cancel discarded the
  pending import. PASS.
- Reader TOC hierarchy and exact child navigation: all six supplied EPUBs. PASS.
- The Sea Reader TOC begins at Chapter I rather than Dedication. PASS.
- Dracula Chapter I target and exact reopen checkpoint. PASS.
- Nature interior checkpoint and exact reopen checkpoint. PASS.
- The Sea interior checkpoint and reopen checkpoint. PASS.
- Free-reading stream contains no Finish/Read Next/check-in interruption. PASS.
- Whole-book progress rail remains visible and updates with scrolling. PASS.
- Page-by-page swipe and forward/back section-boundary turn. PASS.
- Font size supports 13–48 px; repeated direct slider drags remained consistent.
  PASS.
- Thirty-day planned-reading regression: day controls and planned boundaries remain
  present; free-stream markers remain absent. PASS.
- JavaScript syntax, manifest JSON and ZIP integrity. PASS.

## Remaining validation boundary

Mobile Chromium emulation cannot reproduce every iPhone Safari or installed-PWA
memory/lifecycle detail. The supplied exact EPUBs should therefore receive one
final real-device pass after deployment. This is a validation boundary, not a known
unresolved defect.
