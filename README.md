# SecureFile

A secure, user-friendly web app for encrypted file storage, sharing, and management with folder support, previews, and user settings.

---

## Features

- **User Authentication**: Register, login, and optional 2FA.
- **Encrypted File Storage**: All files are encrypted per user.
- **Folders & Organization**: Create, rename, delete, and move folders and files (drag-and-drop supported).
- **Breadcrumb Navigation**: Easily see and navigate your folder path.
- **File Previews**: Inline preview for images, PDFs, audio, video, and text files.
- **Progress Bar**: Real-time upload progress for each file.
- **User Settings**: Change email, password, enable dark mode, and (demo) 2FA setup.
- **Dark Mode**: Toggle dark/light theme, with persistent preference.

---

## Getting Started

### 1. **Requirements**
- PHP 7.2+
- A web server (Apache, Nginx, etc.)
- Write permissions for the `data/` and `keys/` folders

### 2. **Installation**
1. Clone or copy the repository files to your web server directory.
2. Make sure the following folders exist and are writable:
   - `data/`
   - `keys/`
3. Open the app in your browser.

### 3. **Usage**
- **Register** a new account.
- **Login** and complete 2FA if enabled.
- **Upload** files, create folders, and organize your files.
- **Preview** supported files by clicking the preview button.
- **Manage** your account via the ⚙️ settings button (top center).

---

## File Structure

- `index.html` — Main UI
- `script.js` — Frontend logic
- `style.css` — Styles (light & dark mode)
- `upload.php` — Handles file uploads and encryption
- `download.php` — Handles secure file downloads and previews
- `get_files.php`, `create_folder.php`, `rename_file.php`, `rename_folder.php`, `delete_file.php`, `delete_folder.php`, `move_file.php`, `move_folder.php` — File/folder management
- `update_profile.php` — User settings (email, password)
- `auth.php`, `send_2fa_code.php`, `verify_2fa.php` — Authentication and 2FA

---

## Security Notes

- Each user's files are encrypted with their own key.
- Passwords are hashed using PHP's `password_hash`.
- 2FA is supported (demo implementation, extend as needed).

---

## Customization

- **Enable/disable features** by editing the relevant PHP/JS files.
- **Style** the app by modifying `style.css`.
- **Extend** file preview support by updating `previewFile` in `script.js`.

---

## License

MIT License

---

**Enjoy using
