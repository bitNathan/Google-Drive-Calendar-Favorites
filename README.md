# Google Drive Calendar Favorites
_Search through google drive folders and mark files as "used on: date". Calendar view shows which files were used on each date. When looking at files highlight/gradient based on last used and most often used._

Appplication (should) support viewing and downloading files along with adding and viewing metadata.
- Notably doesn't add file uploading or editing.

## Roadmap

| Status | Task                       | Subtasks                                                                                   |
|--------|----------------------------|--------------------------------------------------------------------------------------------|
| ☐      | Google Drive API Auth      | ✔ functional authentication <br> ☐ encrypt OAuth tokens in local file <br> ✔ check if user needs to consent or already has before consent screen is shown <br> ✔ handle refresh tokens (only needed when session lasts over an hour) <br> ☐ use custom URI scheme and enforce PKCE |
| ☐      | CLI                        | ✔ file navigation <br> ✔ file download <br> ✔ show "used: date" metadata when navigating files <br> ✔ add metadata to file with format "used: date" <br> ✔ "comfortable" file/folder navigation (instead of listing every file in drive...) <br> ☐ get files with usedOn dates within restrictions <br> ☐ pagination (to essentially all of above api calls) |
| ☐      | MVP Checkpoint             | ☐ package executable <br> ☐ CI/CD pipeline with github actions <br> ☐ automate security checks and testing <br> ☐ update settings/config via cli <br> ☐ Google app verification |
| ☐      | React GUI                  | ☐ file navigation, download, and add metadata <br> ☐ file metadata highlighting/gradient/sorting when navigating <br> ☐ calendar view <br> ☐ settings/config |
| ☐      | Packaging Targets          | ☐ electron desktop app <br> ☐ deploy to render <br> &nbsp;&nbsp; ☐ split app into "web", "desktop", and "shared" files to split builds in mono-repo <br> &nbsp;&nbsp; ☐ use render's postgress db to store oath data instead of local json |
