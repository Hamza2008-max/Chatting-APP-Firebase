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
  apiKey: "AIzaSyC5VzOG1qtarTJVFBz5e5IhT4UtYOEMze0",
  authDomain: "smit-projects-firebasehosted.firebaseapp.com",
  databaseURL:
    "https://smit-projects-firebasehosted-default-rtdb.firebaseio.com",
  projectId: "smit-projects-firebasehosted",
  storageBucket: "smit-projects-firebasehosted.firebasestorage.app",
  messagingSenderId: "950002855052",
  appId: "1:950002855052:web:d0e9f187e074a9303e5fa9",
  measurementId: "G-LSN7YPPMK4",

  databaseURL:
    "https://smit-projects-firebasehosted-default-rtdb.firebaseio.com/",
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
    });
    console.log("USER SAVED TO REALTIME DATABASE!");

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
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    document.getElementById("current-user-email").textContent = user.email;
    loadRegisteredUsers();
  } else {
    console.log("No user logged in.");
    document.getElementById("chat-screen").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
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
    const partnerSnapshot = await get(
      ref(rtdb, `userDirectory/${partnerKey}`)
    );

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

    const currentEmail = currentUser.email.toLowerCase();

    const roomId = [
      currentUser.uid,
      partnerData.uid
    ].sort().join("_");

    const roomRef = doc(db, "chats", roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists()) {
      await setDoc(roomRef, {
        participants: [
          currentEmail,
          partnerEmail
        ].sort(),
        updatedAt: firestoreServerTimestamp()
      });
    }

    console.log("Chat room ready:", roomId);

    return roomId;

  } catch (error) {
    console.error("Chat Error:", error);
    alert("Chat Error: " + error.message);
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

// --------------------------------------------------
// UI EVENT LISTENERS
// --------------------------------------------------

const showLoginButton = document.getElementById("show-login");
const showSignupButton = document.getElementById("show-signup");
const loginPanel = document.getElementById("login-panel");
const signupPanel = document.getElementById("signup-panel");
const authSubtitle = document.getElementById("auth-subtitle");
const switchToSignupButton = document.getElementById("switch-to-signup");
const switchToLoginButton = document.getElementById("switch-to-login");
const logoutButton = document.getElementById("logout-btn");
const newChatButton = document.getElementById("new-chat-btn");
const sendButton = document.getElementById("send-btn");
const chatList = document.getElementById("chat-list");
const messagesBox = document.getElementById("messages-box");
const messageInput = document.getElementById("message-input");

function setAuthMode(mode) {
  const isSignup = mode === "signup";
  loginPanel.classList.toggle("hidden", isSignup);
  signupPanel.classList.toggle("hidden", !isSignup);
  showLoginButton.classList.toggle("active", !isSignup);
  showSignupButton.classList.toggle("active", isSignup);
  authSubtitle.textContent = isSignup
    ? "Create an account to start your conversations."
    : "Welcome back! Sign in to continue your conversations.";
}

showLoginButton.addEventListener("click", () => setAuthMode("login"));
showSignupButton.addEventListener("click", () => setAuthMode("signup"));
switchToSignupButton.addEventListener("click", () => setAuthMode("signup"));
switchToLoginButton.addEventListener("click", () => setAuthMode("login"));

loginPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  loginUser(
    document.getElementById("login-email").value,
    document.getElementById("login-pass").value,
  );
});

signupPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  signUpUser(
    document.getElementById("signup-name").value,
    document.getElementById("signup-email").value,
    document.getElementById("signup-pass").value,
  );
});

logoutButton.addEventListener("click", logoutUser);

let activeRoomId = null;
let stopListeningToMessages = null;

function openChat(roomId, partnerEmail, chatButton) {
  activeRoomId = roomId;
  chatList.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.toggle("active", item === chatButton);
  });
  document.getElementById("active-chat-title").textContent = partnerEmail;
  document.getElementById("active-chat-avatar").textContent = partnerEmail
    .charAt(0)
    .toUpperCase();
  messagesBox.replaceChildren();

  if (stopListeningToMessages) {
    stopListeningToMessages();
  }

  stopListeningToMessages = listenToMessages(roomId, (messages) => {
    messagesBox.replaceChildren();
    messages.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${
        auth.currentUser && message.senderId === auth.currentUser.uid
          ? "sent"
          : "received"
      }`;

      const textElement = document.createElement("span");
      textElement.className = "message-text";
      textElement.textContent = message.text;
      messageElement.appendChild(textElement);
      messagesBox.appendChild(messageElement);
    });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  });
}

// --------------------------------------------------
// LOAD ALL REGISTERED USERS
// --------------------------------------------------

async function loadRegisteredUsers() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const usersRef = ref(rtdb, "users");
    const snapshot = await get(usersRef);

    chatList.replaceChildren();

    if (!snapshot.exists()) {
      chatList.textContent = "No registered users found.";
      return;
    }

    snapshot.forEach((userSnapshot) => {
      const user = userSnapshot.val();

      // Don't display the currently logged-in user
      if (user.uid === currentUser.uid) return;

      const chatButton = document.createElement("button");

      chatButton.type = "button";
      chatButton.className = "chat-item";

      const avatar = document.createElement("span");
      avatar.className = "small-avatar";
      avatar.textContent = (user.name || user.email)
        .charAt(0)
        .toUpperCase();

      const summary = document.createElement("span");
      summary.className = "summary";

      const title = document.createElement("h4");
      title.textContent = user.name || user.email;

      const email = document.createElement("p");
      email.textContent = user.email;

      summary.append(title, email);
      chatButton.append(avatar, summary);

      chatButton.addEventListener("click", async () => {
        const roomId = await startNewChat(user.email);

        if (roomId) {
          chatButton.dataset.roomId = roomId;
          openChat(roomId, user.email, chatButton);
        }
      });

      chatList.appendChild(chatButton);
    });

  } catch (error) {
    console.error("Error loading registered users:", error);
    alert("Could not load users: " + error.message);
  }
}

newChatButton.addEventListener("click", async () => {
  const recipientEmail = document.getElementById("recipient-email").value;
  const roomId = await startNewChat(recipientEmail);
  if (!roomId) {
    return;
  }

  let chatButton = chatList.querySelector(`[data-room-id="${roomId}"]`);
  if (!chatButton) {
    chatButton = document.createElement("button");
    chatButton.type = "button";
    chatButton.className = "chat-item";
    chatButton.dataset.roomId = roomId;

    const avatar = document.createElement("span");
    avatar.className = "small-avatar";
    avatar.textContent = recipientEmail.charAt(0).toUpperCase();

    const summary = document.createElement("span");
    summary.className = "summary";
    const title = document.createElement("h4");
    title.textContent = recipientEmail;
    summary.appendChild(title);

    chatButton.append(avatar, summary);
    chatButton.addEventListener("click", () => {
      openChat(roomId, recipientEmail, chatButton);
    });
    chatList.appendChild(chatButton);
  }

  document.getElementById("recipient-email").value = "";
  openChat(roomId, recipientEmail, chatButton);
});

sendButton.addEventListener("click", async () => {
  if (!activeRoomId) {
    alert("Please select a chat first.");
    return;
  }

  const messageText = messageInput.value;
  await sendMessage(activeRoomId, messageText);
  messageInput.value = "";
});
