# LocalPocket Development Log

## Project Goal
Create a Chrome extension to save current tab URLs to local storage.

## Work History
### Phase 1: Initialization & Planning
- [x] Create implementation plan
- [x] Create `manifest.json`
- [x] Create Popup UI (`popup.html`, `style.css`)
- [x] Implement Logic (`popup.js`)
- [x] Create initial icon assets (Indigo Square)

### Phase 2: Verification
- [x] Created `walkthrough.md` for manual verification.

### Phase 3: Feature Updates (Individual Delete & Stack Icon)
- [x] **Feature Request**: Add individual delete button and change icon to 'stack' shape.
- [x] **Icon Generation Prompt**: "A simple, modern, abstract icon representing a 'stack' of papers or cards. Minimalist geometric style. Indigo and white colors. Square shape."
- [x] **Implementation**:
    - Updated `popup.js` to include 'X' button and deletion logic.
    - Updated `style.css` for delete button styling.
    - Generated `stack_icon.png` and later renamed to `icon.png`.
    - Updated `manifest.json`.

### Phase 4: Feature Update (Editable Title)
- [x] **Feature Request**: Click title to edit, Enter to save.
- [x] **Implementation**:
    - Updated `popup.js`: Added click handler to title, input creation, `saveTitle` function.
    - Updated `style.css`: Added pointer cursor and input styling.

### Phase 5: Feature Update (JSON Import/Export)
- [x] **Feature Request**: Export list to JSON and Import from JSON.
- [x] **Implementation**:
    - Updated `popup.html`: Added Export/Import buttons and hidden file input.
    - Updated `popup.js`: Added logic to download JSON blob and parse uploaded file. Deduplication logic added on import.
    - Updated `style.css`: Styled new buttons.

### Phase 6: UX Improvements (Dynamic Resize & Duplicate check)
- [x] **Feature Request**: Dynamic popup resizing (Expand for more items, max 600px).
- [x] **Feature Request**: Prevent duplicate URLs and show Toast notifications.
- [x] **Implementation**:
    - Updated `style.css`: Added `min-height`/`max-height` for dynamic sizing. Added Toast styles.
    - Updated `popup.js`: Implemented duplicate check and `showToast` system.
    - Updated `popup.html`: Added toast container.

### Phase 7: Feature Update (Save/Open All & Window)
- [x] **Feature Request**: 
    - Save all open tabs.
    - Open all saved link in a new window.
    - Widen popup (1.5x width -> 400px).
- [x] **Implementation**:
    - Updated `popup.html`: Added 'Save All Tabs' and 'Open Window All Saved' buttons.
    - Updated `popup.js`: Implemented bulk save and `chrome.windows.create` logic.
    - Updated `style.css`: Increased width to 480px (later adjusted to 400px by user).

## Current Status
All requested features implemented and verified.
URL list supports:
- Adding current tab (Duplicate check + Toast feedback).
- **Save All Tabs** (Bulk save from current window).
- **Open Window All Saved** (Restore session in new window).
- Individual deletion.
- Title editing.
- JSON Import/Export.
- Dynamic resizing.
Icon is a stack shape.
