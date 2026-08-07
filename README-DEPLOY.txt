ReadPlanner Build 95 deployment
===============================

This repository should remain on:
Settings → Pages → Source: GitHub Actions
using the existing “Deploy static content to Pages” workflow.

1. In the working ReadPlanner repository, replace the existing public app files
   with all files from this ZIP. Keep vendor/ and icons/ unchanged in structure.
2. Commit the upload. The existing Static HTML GitHub Actions workflow will start
   automatically; do not switch Pages back to “Deploy from a branch”.
3. Wait for the workflow's deploy job to show a green check.
4. Fully close every Safari tab and installed ReadPlanner window, then reopen it.
   The service worker identifies this release as build 95.
5. For EPUBs already stored by an older build, import the same file again and
   confirm the existing-book prompt to refresh its parser/TOC representation.

The app is a static PWA and does not require npm, Jekyll, a build command or a
server framework. The browser's stored library is independent of deployment
files. Replacing site files does not intentionally erase books, plans,
highlights, notes, bookmarks, check-ins or reading positions. A normal backup
remains prudent before deployment.
