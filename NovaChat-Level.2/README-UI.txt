NOVACHAT - UI REFRESH NOTES
===========================

This is the same working NovaChat application with a new "Dark Premium" appearance.
No application logic, Firebase configuration or database rules were changed.

HOW TO RUN (unchanged)
1. Serve this folder with a local web server (e.g. VS Code "Live Server").
   Do NOT open the HTML files with file:// - Firebase modules need http(s).
2. Open login.html or signup.html in the browser.
3. For Firebase/Realtime Database setup and test steps, see README.txt (original).

WHAT CHANGED (presentation only)
- style.css        : completely restyled (design tokens, dark theme, responsive layout).
- login.html       : title/brand text, form labels, heading block, placeholder text.
- signup.html      : same as login + a "at least 6 characters" hint under the password.
- dashboard.html   : page title, brand text, data-bs-theme="dark", theme-color meta only.

UNTOUCHED (byte-identical to the original)
- firebase-config.js, database.rules.json
- login.js, signup.js, dashboard.js
- README.txt

NOTES
- Fonts: uses "Inter" if installed, otherwise the system UI font. No new libraries or CDNs were added;
  Bootstrap 5.3.3 is still loaded from the same CDN link as before.
- Not included, because they need JavaScript/data changes: message timestamps, online-status
  indicators, user initials in avatars. Avatars are decorative icons.
