ReadPlanner Build 96 deployment
===============================

Keep this repository on:
Settings → Pages → Source: GitHub Actions
using the existing “Deploy static content to Pages” workflow.

1. Open the working ReadPlanner2 repository.
2. Choose Add file → Upload files.
3. Upload every file and folder from this unzipped Build 96 package directly over
   the existing repository-root files. Do not delete the stored app data and do
   not change the icons/ or vendor/ folder structure.
4. Commit the upload. The existing Static HTML GitHub Actions workflow will start
   automatically; do not switch Pages back to “Deploy from a branch”.
5. Wait for the deploy job to show a green check.
6. Fully close every Safari tab and installed ReadPlanner window, then reopen it.
   The service worker identifies this release as build 96.

No EPUB re-import is required solely for these Build 96 corrections. Preserved
source TOC data is remapped at runtime, and books, plans, highlights, notes,
bookmarks, check-ins and reading positions remain browser-stored independently
of the deployed site files. A normal backup remains prudent before deployment.
