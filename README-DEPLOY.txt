ReadPlanner Build 94 deployment
===============================

1. Replace the existing GitHub Pages files with all files from this ZIP.
2. Keep the folder structure unchanged, including vendor/ and icons/.
3. Wait for GitHub Pages to finish publishing.
4. Fully close every Safari tab and installed ReadPlanner window, then reopen it.
   The service worker identifies this release as build 94.
5. For EPUBs already stored by an older build, import the same file again and
   confirm the existing-book prompt to refresh its parser/TOC representation.

The project is a static PWA and does not require npm, a build command or a server
framework. Do not upload index.before_lazy.html or any test-only backup file.

The browser’s stored library is independent of the deployment files. Replacing the
site files does not intentionally erase books, reading plans, highlights, notes,
bookmarks, check-ins or reading positions. A normal backup remains prudent before
any deployment.
