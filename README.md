# Google Drive Calendar Favorites
_Search through google drive folders and mark files as "used on: date". Calendar view shows which files were used on each date. When looking at files highlight/gradient based on last used and most often used._

Appplication (should) support viewing and downloading files along with adding and viewing metadata.
- Notably doesn't add file uploading or editing.

## TODO

_Project is in progress. As always, todo list is subject to change._

- [x] google drive API authentication
    - [x] cleanup authentication
    - [ ] check if user needs to conset or already has before consent screen is shown
    - [ ] handle refresh tokens (only needed when session lasts over an hour)
- [ ] cli
    - [ ] file navigation
    - [ ] file download
    - [ ] add metadata to file with format "used: date"
    - [ ] show "used: date" metadata when navigating files
- [ ] automate testing and create CI/CD pipeline with github actions
- [ ] react gui
    - [ ] file navigation, download, and add metadata
    - [ ] file metadata highlighting/gradient
    - [ ] calendar
