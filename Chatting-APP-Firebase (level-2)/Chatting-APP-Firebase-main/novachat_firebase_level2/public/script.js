import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp as firestoreServerTimestamp,
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  getDatabase,
  ref,
  get,
  set,
  serverTimestamp as databaseServerTimestamp,
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  // KEEP YOUR EXISTING FIREBASE CONFIGURATION HERE
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "smit-projects-firebasehosted",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",

  databaseURL:
    "https://smit-projects-firebasehosted-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Convert email into a Firebase-compatible database key
function emailToDatabaseKey(email) {
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// --------------------------------------------------
// SIGN UP
// --------------------------------------------------

async function signUpUser(name, email, password) {
  try {
    name = name.trim();
    email = email.trim().toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;

    // Save user profile in Realtime Database
    console.log("Attempting to save user in Realtime Database...");
    await set(ref(rtdb, `users/${user.uid}`), {
      name: name,
      email: email,
      uid: user.uid,
      createdAt: databaseServerTimestamp(),
    }); console.log("USER SAVED TO REALTIME DATABASE!");

    // Save user directory entry in Realtime Database
    await set(ref(rtdb, `userDirectory/${emailToDatabaseKey(email)}`), {
      email: email,
      uid: user.uid,
    });

    alert("Account created successfully!");
  } catch (error) {
    console.error("Signup Error:", error);
    alert(error.message);
  }
}
console.log("SIGNUP FUNCTION STARTED!");

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

async function loginUser(email, password) {
  try {
    email = email.trim().toLowerCase();

    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");
  } catch (error) {
    console.error("Login Error:", error);
    alert(error.message);
  }
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

async function logoutUser() {
  try {
    await signOut(auth);
    alert("Logged out successfully!");
  } catch (error) {
    console.error("Logout Error:", error);
    alert(error.message);
  }
}

// --------------------------------------------------
// AUTHENTICATION STATE
// --------------------------------------------------

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in:", user.email);
  } else {
    console.log("No user logged in.");
  }
});

// --------------------------------------------------
// START NEW CHAT
// --------------------------------------------------

async function startNewChat(partnerEmail) {
  try {
    partnerEmail = partnerEmail.trim().toLowerCase();

    const partnerKey = emailToDatabaseKey(partnerEmail);

    // Find user in Realtime Database
    const partnerSnapshot = await get(ref(rtdb, `userDirectory/${partnerKey}`));

    if (!partnerSnapshot.exists()) {
      alert("User not registered!");
      return;
    }

    const partnerData = partnerSnapshot.val();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    const roomId = [currentUser.uid, partnerData.uid].sort().join("_");

    const roomRef = doc(db, "chats", roomId);

    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists()) {
      await setDoc(roomRef, {
        participants: [currentUser.uid, partnerData.uid],
        createdAt: firestoreServerTimestamp(),
      });
    }

    console.log("Chat room ready:", roomId);

    return roomId;
  } catch (error) {
    console.error("Chat Error:", error);
    alert(error.message);
  }
}

// --------------------------------------------------
// SEND MESSAGE
// --------------------------------------------------

async function sendMessage(roomId, messageText) {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if (!messageText.trim()) {
      return;
    }

    await addDoc(collection(db, "chats", roomId, "messages"), {
      senderId: currentUser.uid,
      text: messageText.trim(),
      createdAt: firestoreServerTimestamp(),
    });
  } catch (error) {
    console.error("Message Error:", error);
    alert(error.message);
  }
}

// --------------------------------------------------
// LISTEN TO MESSAGES
// --------------------------------------------------

function listenToMessages(roomId, callback) {
  const messagesQuery = query(
    collection(db, "chats", roomId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = [];

      snapshot.forEach((document) => {
        messages.push({
          id: document.id,
          ...document.data(),
        });
      });

      callback(messages);
    },
    (error) => {
      console.error("Messages Listener Error:", error);
    },
  );
}

// --------------------------------------------------
// EXPORT FUNCTIONS
// --------------------------------------------------

window.signUpUser = signUpUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.startNewChat = startNewChat;
window.sendMessage = sendMessage;
window.listenToMessages = listenToMessages;
