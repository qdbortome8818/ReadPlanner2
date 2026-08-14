ReadPlanner Build 109 deployment
================================

Keep this repository on:
Settings → Pages → Source: GitHub Actions
using the existing “Deploy static content to Pages” workflow.

1. Open the working ReadPlanner2 repository.
2. Choose Add file → Upload files.
3. Upload every file and folder from this unzipped Build 109 package directly over the existing repository-root files. Keep the icons/ and vendor/ folder structure.
4. Commit the upload and wait for the existing Static HTML GitHub Actions workflow to finish with a green check.
5. On the iPhone, fully close the installed ReadPlanner window and any Safari tab displaying ReadPlanner, then reopen the published site. If Safari has kept an old process alive, closing all ReadPlanner clients once allows the updated service worker/cache identity to settle.
6. Run the acceptance sequence that exposed the Build 108 failure:
   collection → Contents → article title → expanded page thumbnails → Page 5 → scroll/read → close/leave → reopen the same collection.
7. Also confirm that the collection remains under Today’s Reading / Current Reading and resumes at the saved chapter/page.

Build 109 identifies the runtime, manifest cache-buster and service-worker cache as 109. No EPUB re-import is required solely for this stability repair. Books, plans, highlights, notes, bookmarks, check-ins and reading positions remain browser-stored independently of the deployed site files. A normal backup remains prudent before deployment.
