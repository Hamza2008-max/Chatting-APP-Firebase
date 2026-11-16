// NovaChat — Firebase Authentication + Cloud Firestore
// Firebase JS SDK v13.3.0 (ES Modules)

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// 1) Replace this object with your Firebase project's Web App config.
// Firebase Console > Project settings > General > Your apps > SDK setup and configuration.
const firebaseConfig = {
  apiKey: "AIzaSyC5VzOG1qtarTJVFBz5e5IhT4UtYOEMze0",
  authDomain: "smit-projects-firebasehosted.firebaseapp.com",
  projectId: "smit-projects-firebasehosted",
  storageBucket: "smit-projects-firebasehosted.firebasestorage.app",
  messagingSenderId: "950002855052",
  appId: "1:950002855052:web:d0e9f187e074a9303e5fa9",
  measurementId: "G-LSN7YPPMK4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Existing HTML elements (IDs kept from your original UI) ----------
const $ = (id) => document.getElementById(id);

const authScreen = $("auth-screen");
const chatScreen = $("chat-screen");
const authSubtitle = $("auth-subtitle");
const loginPanel = $("login-panel");
const signupPanel = $("signup-panel");
const loginEmail = $("login-email");
const loginPass = $("login-pass");
const signupName = $("signup-name");
const signupEmail = $("signup-email");
const signupPass = $("signup-pass");
const currentUserEmail = $("current-user-email");
const recipientEmail = $("recipient-email");
const chatList = $("chat-list");
const chatTitle = $("active-chat-title");
const activeChatAvatar = $("active-chat-avatar");
const messagesBox = $("messages-box");
const messageInput = $("message-input");
const showLoginBtn = $("show-login");
const showSignupBtn = $("show-signup");

const state = {
  user: null,
  activePartner: null,
  activeRoomId: null,
  conversations: [],
  unsubscribeChats: null,
  unsubscribeMessages: null
};

function setAuthMode(mode) {
  const isLogin = mode === "login";
  loginPanel.classList.toggle("hidden", !isLogin);
  signupPanel.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("active", isLogin);
  showSignupBtn.classList.toggle("active", !isLogin);
  authSubtitle.textContent = isLogin
    ? "Welcome back! Sign in to continue your conversations."
    : "Create your account and start chatting with friends.";
}

function getInitials(email = "") {
  return email.split("@")[0].slice(0, 2).toUpperCase() || "N";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function showAuthScreen() {
  authScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}

function showChatScreen(user) {
  authScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  currentUserEmail.textContent = user.email;
}

function stopChatListeners() {
  if (state.unsubscribeChats) state.unsubscribeChats();
  if (state.unsubscribeMessages) state.unsubscribeMessages();
  state.unsubscribeChats = null;
  state.unsubscribeMessages = null;
}

function makeRoomId(emailA, emailB) {
  // Required assignment format: lowercase, alphabetically sorted, joined by "_".
  return [emailA.toLowerCase(), emailB.toLowerCase()].sort().join("_");
}

// ---------- Authentication ----------
async function signUpUser() {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim().toLowerCase();
  const password = signupPass.value;

  if (name.length < 2) return alert("Please enter your full name.");
  if (!email || !email.includes("@")) return alert("Please enter a valid email address.");
  if (password.length < 6) return alert("Firebase passwords must be at least 6 characters.");

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Private profile: only this account can read/write its own users/{email} document.
    await setDoc(doc(db, "users", email), {
      name,
      email,
      uid: user.uid,
      createdAt: serverTimestamp()
    });

    // Minimal email directory supports recipient lookup without exposing private profiles.
    // Directory reads are authenticated and individual-document-only (no listing).
    await setDoc(doc(db, "userDirectory", email), { email });

    signupName.value = "";
    signupEmail.value = "";
    signupPass.value = "";
    // onAuthStateChanged will switch to the chat screen.
  } catch (error) {
    console.error("Sign up failed:", error);
    alert(friendlyAuthError(error));
  }
}

async function loginUser() {
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPass.value;

  if (!email || !email.includes("@")) return alert("Please enter a valid email address.");
  if (!password) return alert("Please enter your password.");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginEmail.value = "";
    loginPass.value = "";
    // onAuthStateChanged handles the screen change.
  } catch (error) {
    console.error("Login failed:", error);
    alert(friendlyAuthError(error));
  }
}

function friendlyAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "That email is already registered. Please log in.",
    "auth/invalid-email": "That email address is not valid.",
    "auth/weak-password": "Choose a stronger password (at least 6 characters).",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found for that email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/network-request-failed": "Network error. Check your internet connection."
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    alert(error.message);
  }
}

// Firebase is the source of truth for login state. Do not use localStorage for passwords/sessions.
onAuthStateChanged(auth, (user) => {
  stopChatListeners();
  state.user = user;
  state.activePartner = null;
  state.activeRoomId = null;
  state.conversations = [];
  chatList.innerHTML = "";
  messagesBox.innerHTML = "";

  if (user) {
    showChatScreen(user);
    listenForConversations(user.email.toLowerCase());
  } else {
    showAuthScreen();
    currentUserEmail.textContent = "";
    chatTitle.textContent = "Select a chat";
    activeChatAvatar.textContent = "N";
    messageInput.value = "";
    setAuthMode("login");
  }
});

// ---------- Starting a conversation ----------
async function startNewChat() {
  if (!state.user) return alert("Please log in first.");

  const partner = recipientEmail.value.trim().toLowerCase();
  const me = state.user.email.toLowerCase();

  if (!partner || !partner.includes("@")) return alert("Please enter a valid email address.");
  if (partner === me) return alert("You cannot start a chat with yourself.");

  try {
    // Look up only the minimal directory record; user profiles remain private.
    const directorySnap = await getDoc(doc(db, "userDirectory", partner));
    if (!directorySnap.exists()) {
      return alert("This email is not registered on NovaChat.");
    }

    const roomId = makeRoomId(me, partner);
    const roomRef = doc(db, "chats", roomId);

    // Create metadata once. If it already exists, do not overwrite participants.
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      await setDoc(roomRef, {
        participants: [me, partner].sort(),
        updatedAt: serverTimestamp()
      });
    }

    recipientEmail.value = "";
    openChat(partner, roomId);
  } catch (error) {
    console.error("Could not start chat:", error);
    alert(`Could not start chat: ${error.message}`);
  }
}

// ---------- Live sidebar ----------
function listenForConversations(email) {
  const chatsQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", email)
  );

  state.unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
    state.conversations = snapshot.docs.map((chatDoc) => {
      const data = chatDoc.data();
      const partner = data.participants.find((participant) => participant !== email);
      return { roomId: chatDoc.id, partner, updatedAt: data.updatedAt };
    });

    renderChatList();

    if (!state.activeRoomId && state.conversations.length) {
      const first = state.conversations[0];
      openChat(first.partner, first.roomId);
    }
  }, (error) => {
    console.error("Conversation listener error:", error);
    alert(`Could not load conversations: ${error.message}`);
  });
}

function renderChatList() {
  chatList.innerHTML = "";

  if (!state.conversations.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No chats yet. Start a conversation with a friend by email.";
    chatList.appendChild(empty);
    return;
  }

  state.conversations.forEach(({ partner, roomId }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `chat-item ${roomId === state.activeRoomId ? "active" : ""}`;
    item.innerHTML = `
      <span class="small-avatar">${getInitials(partner)}</span>
      <span class="summary">
        <h4>${escapeHtml(partner)}</h4>
        <p>Open conversation</p>
      </span>`;
    item.addEventListener("click", () => openChat(partner, roomId));
    chatList.appendChild(item);
  });
}

// ---------- Live messages ----------
function openChat(partnerEmail, roomId) {
  if (!partnerEmail || !roomId) return;

  if (state.unsubscribeMessages) state.unsubscribeMessages();
  state.unsubscribeMessages = null;

  state.activePartner = partnerEmail;
  state.activeRoomId = roomId;
  chatTitle.textContent = partnerEmail;
  activeChatAvatar.textContent = getInitials(partnerEmail);
  renderChatList();

  messagesBox.innerHTML = '<div class="empty-state">Loading messages...</div>';

  const messagesQuery = query(
    collection(db, "chats", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  state.unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    messagesBox.innerHTML = "";

    if (snapshot.empty) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Say hello and start the conversation.";
      messagesBox.appendChild(empty);
      return;
    }

    snapshot.forEach((messageDoc) => {
      const message = messageDoc.data();
      const bubble = document.createElement("div");
      const isSent = message.sender === state.user.email.toLowerCase();
      bubble.className = `message ${isSent ? "sent" : "received"}`;
      bubble.innerHTML = `
        <span class="message-text">${escapeHtml(message.text)}</span>
        <span class="message-time">${escapeHtml(formatTime(message.createdAt))}</span>`;
      messagesBox.appendChild(bubble);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }, (error) => {
    console.error("Message listener error:", error);
    messagesBox.innerHTML = '<div class="empty-state">Could not load messages.</div>';
    alert(`Could not load messages: ${error.message}`);
  });
}

async function sendMessage() {
  if (!state.user) return alert("Please log in first.");
  if (!state.activeRoomId) return alert("Select or start a conversation first.");

  const text = messageInput.value.trim();
  if (!text) return;
  if (text.length > 5000) return alert("Message is too long (maximum 5000 characters).");

  const messageText = text;
  messageInput.value = "";

  try {
    const roomRef = doc(db, "chats", state.activeRoomId);
    await addDoc(collection(roomRef, "messages"), {
      sender: state.user.email.toLowerCase(),
      text: messageText,
      createdAt: serverTimestamp()
    });
    await setDoc(roomRef, { updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Message send failed:", error);
    messageInput.value = messageText;
    alert(`Message could not be sent: ${error.message}`);
  }
}

// ---------- Button and keyboard events ----------
showLoginBtn.addEventListener("click", () => setAuthMode("login"));
showSignupBtn.addEventListener("click", () => setAuthMode("signup"));
$("switch-to-signup").addEventListener("click", () => setAuthMode("signup"));
$("switch-to-login").addEventListener("click", () => setAuthMode("login"));
$("sign-in-btn").addEventListener("click", loginUser);
$("sign-up-btn").addEventListener("click", signUpUser);
$("logout-btn").addEventListener("click", logout);
$("new-chat-btn").addEventListener("click", startNewChat);
$("send-btn").addEventListener("click", sendMessage);

loginPass.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginUser();
});
signupPass.addEventListener("keydown", (event) => {
  if (event.key === "Enter") signUpUser();
});
recipientEmail.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startNewChat();
});
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

setAuthMode("login");
