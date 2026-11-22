NOVACHAT / SMIT FIREBASE CHAT APP

This is the updated version of the supplied SMIT starter project. It uses Firebase Authentication (Email/Password) and Firebase Realtime Database.

FIREBASE PROJECT
Project ID: smit-projects-firebasehosted
Realtime Database: https://smit-projects-firebasehosted-default-rtdb.firebaseio.com

FILES
- login.html / login.js: sign in
- signup.html / signup.js: create account and save a user profile
- dashboard.html / dashboard.js: live user list, select a user, send and receive messages
- firebase-config.js: your Firebase web configuration
- database.rules.json: suggested Realtime Database security rules

SETUP
1. In Firebase Console, confirm Authentication > Sign-in method > Email/Password is enabled.
2. Confirm Realtime Database exists in the same Firebase project.
3. Open Realtime Database > Rules, review database.rules.json, and publish those rules.
4. Run the folder through a local web server (for example VS Code Live Server). Do not open the HTML files directly with file://.
5. Open signup.html and create two different test accounts, preferably in two separate browsers or one normal and one incognito window.
6. Sign in as account A, select account B from Registered Users, and send a message. Sign in as B in the other browser to verify receiving and replying.

EXISTING ACCOUNTS
When an existing Firebase Auth account first opens the dashboard, the app creates a basic Realtime Database user profile if one does not exist. The display name falls back to the email prefix. New signups save the name entered in the signup form.

IMPORTANT
This starter version stores its user directory and chat messages in Realtime Database. Existing Firestore userDirectory records are not automatically migrated. Firebase web apiKey/appId values identify the web app and are not server credentials; never put service-account private keys in frontend code.

If you see permission_denied, verify that the rules have been published and that the user is signed in.
