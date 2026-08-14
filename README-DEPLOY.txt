ReadPlanner Build 111 deployment
================================

Keep this repository on:
Settings -> Pages -> Source: GitHub Actions
using the existing "Deploy static content to Pages" workflow.

1. Open the working ReadPlanner2 repository.
2. Choose Add file -> Upload files.
3. Upload every file and folder from this unzipped Build 111 package directly over the existing repository-root files. Keep the icons/ and vendor/ folder structure.
4. Commit the upload and wait for the existing Static HTML GitHub Actions workflow to finish with a green check.
5. On the iPhone, fully close the installed ReadPlanner window and any Safari tab displaying ReadPlanner, then reopen the published site. This ensures the Build 111 service-worker/cache identity is active rather than an older PDF runtime.
6. First test normal reading and pinch zoom. Build 111 intentionally keeps one live iOS PDF page surface and does not rerender PDF.js at the zoomed card width.
7. Then repeat the acceptance sequence:
   collection -> Contents -> article title -> expanded page thumbnails -> arbitrary page -> scroll/read -> Search/highlight -> close/leave -> reopen the same PDF.
8. Repeat across the existing PDFs for several minutes and confirm that reopening remains possible after zooming.
9. Confirm the already-working behaviors remain intact: exact Contents page navigation, exact search/highlight navigation, saved reading-position resume, and Today/Current Reading presence.

Build 111 identifies the runtime, manifest cache-buster and service-worker cache as 111. No EPUB re-import is required solely for this PDF stability repair. Books, plans, highlights, notes, bookmarks, check-ins and reading positions remain browser-stored independently of the deployed site files. A normal backup remains prudent before deployment.
