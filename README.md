# Google Drive Calendar Favorites
_Search through google drive folders and mark files as "used on: date". Calendar view shows which files were used on each date. When looking at files highlight/gradient based on last used and most often used._

Appplication (should) support viewing and downloading files along with adding and viewing metadata.
- Notably doesn't add file uploading or editing.

## TODO

- [ ] google drive API authentication
    - [x] functional authentication
    - [ ] save oath tokens to encrypted local file for persistance
    - [ ] check if user needs to conset or already has before consent screen is shown
    - [ ] handle refresh tokens (only needed when session lasts over an hour)
    - [ ] use custom URI scheme and enforce PKCE
- [ ] cli
    - [x] file navigation
    - [x] file download
    - [x] show "used: date" metadata when navigating files
    - [x] add metadata to file with format "used: date"
    - [ ] "comfortable" file/folder navigation (instead of listing every file in drive...)
    - [ ] get files with usedOn dates within restrictions
    - [ ] pagination (to essentially all calls)
- [ ] MVP checkpoint
    - [ ] automate security checks and testing
    - [ ] package executable
    - [ ] CI/CD pipeline with github actions
- [ ] react gui
    - [ ] file navigation, download, and add metadata
    - [ ] file metadata highlighting/gradient/sorting when navigating
    - [ ] calendar view
- [ ] packaging targets
    - [ ] deploy to render
        - [ ] split app into "web", "desktop", and "shared" files to split builds in mono-repo
        - [ ] use render's postgress db to store oath data instead of local json
    - [ ] electron desktop app
