# NovaChat Firebase starter

## Included
- `public/index.html` and `public/style.css`: your original UI files, unchanged.
- `public/script.js`: Firebase Authentication + real-time Firestore implementation.
- `firestore.rules`: security rules.
- `firebase.json`: Hosting and Firestore rules configuration.

## Important security design note
Your `users/{email}` profile is private to its owner. A signed-in user cannot read another user's private profile just to test whether an email exists. To support email lookup without exposing profiles, this starter also creates `userDirectory/{email}` containing only the email address. Authenticated users can read a known directory document, but cannot list the directory. For a larger production app, move email lookup behind a trusted Cloud Function and add abuse/rate limiting.

## Setup overview
1. In Firebase Console, open the project `smit-projects-firebasehosted`.
2. Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save.
3. Build > Firestore Database > create/confirm the database.
4. Copy the `public` folder contents into your existing Firebase project's `public` folder.
5. Put `firestore.rules` and `firebase.json` in the project root (same level as `public`).
6. From the project root run `firebase login` if needed, then `firebase use --add` and select the correct project.
7. Deploy rules: `firebase deploy --only firestore:rules`.
8. Test locally with `firebase emulators:start` if you have configured emulators, or use `firebase serve` / `firebase emulators:start`. For a simple static preview, VS Code Live Server can serve `public/index.html`, but Hosting deployment is the best Firebase end-to-end test.
9. Deploy Hosting: `firebase deploy --only hosting` (or `firebase deploy` for both Hosting and Firestore rules).

## Test with two accounts
1. Open the site in a normal browser window and create Account A.
2. Open an Incognito window or a second browser and create Account B with a different email.
3. From A, enter B's exact registered email and click Add.
4. Send a message. B should see the conversation and receive the message live.
5. Reply from B and verify A sees it without refreshing.

Never share your Firebase service-account credentials. The Web App config in frontend code is not a password; Firestore Rules are what protect your database.
