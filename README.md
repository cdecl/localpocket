# LocalPocket

**LocalPocket** is a lightweight Chrome extension that allows you to locally save and manage URLs from your browser tabs. It acts as a private, local "read later" list without requiring any external accounts or cloud sync.

## ✨ Features

- **Save Current Tab**: Instantly save the current active tab to your list.
- **Save All Tabs**: Save all open tabs in your current window with one click.
- **Open All in Window**: Open all your saved links in a fresh new window to restore your session.
- **Duplicate Prevention**: Automatically checks for existing URLs and warns you with a toast notification to prevent duplicates.
- **Manage Links**: 
  - **Edit Titles**: Click on any title to rename it for better context.
  - **Delete**: Remove individual items or clear the entire list.
- **Data Portability**: 
  - **Export JSON**: Backup your saved links to a JSON file.
  - **Import JSON**: Restore or merge links from a backup file (smart deduplication included).
- **Dynamic UI**: The popup window automatically resizes based on your list size (expands up to ~5 items before scrolling).
- **Zero Privacy Concerns**: All data is stored in your browser's `local storage`. Nothing is sent to external servers.

## 🚀 Installation (Local Development)

Since this extension is not yet on the Chrome Web Store, you can install it manually using "Developer Mode".

1. **Clone the Repository**
   ```bash
   git clone https://github.com/cdecl/localpocket.git
   ```
   *(Or download the ZIP and extract it)*

2. **Open Chrome Extensions Page**
   - Open Chrome and navigate to `chrome://extensions`.
   - Or click the puzzle icon (🧩) top-right > **Manage Extensions**.

3. **Enable Developer Mode**
   - Toggle the switch named **"Developer mode"** in the top-right corner of the page.

4. **Load Unpacked Extension**
   - Click the **"Load unpacked"** button that appears.
   - Select the `localpocket` directory (the folder containing `manifest.json`).

5. **Pin & Use**
   - The LocalPocket icon (stack shape) should appear in your toolbar.
   - Pin it for easy access!

## 📝 Usage Guide

- **Saving**: Click the extension icon and hit **"Save Current Tab"**.
- **Editing**: Click the text of any saved item to rename it. Press `Enter` to save or `Esc` to cancel.
- **Deleting**: Click the `×` button next to an item to remove it.
- **Import/Export**: Use the buttons at the bottom to backup or restore your data.

## 🛠 Tech Stack

- **HTML5 / CSS3** (Vanilla, CSS Variables)
- **JavaScript** (ES6+)
- **Chrome Extensions API** (Manifest V3, Storage API)

---
*Created by [cdecl](https://github.com/cdecl) for personal productivity.*
