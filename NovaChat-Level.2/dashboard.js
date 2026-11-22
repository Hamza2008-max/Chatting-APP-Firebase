import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  ref,
  push,
  set,
  get,
  onValue,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";
import { auth, db } from "./firebase-config.js";

const dashboardContainer = document.getElementById("dashboard-container");
const currentUserNameEl = document.getElementById("current-user-name");
const logoutBtn = document.getElementById("logout-btn");
const usersListEl = document.getElementById("users-list");
const noChatSelectedEl = document.getElementById("no-chat-selected");
const chatWindowEl = document.getElementById("chat-window");
const chatHeaderEl = document.getElementById("chat-header");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

let currentUser = null;
let selectedUser = null;
let unsubscribeUsers = null;
let unsubscribeMessages = null;
let usersCache = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  currentUser = user;
  currentUserNameEl.textContent = user.displayName || user.email || "User";
  dashboardContainer.classList.remove("hidden");

  try {
    // Ensure older authenticated accounts also get a directory profile in RTDB.
    // Their display name falls back to the email prefix if no name is available.
    const profileRef = ref(db, `users/${user.uid}`);
    const profileSnapshot = await get(profileRef);
    if (!profileSnapshot.exists()) {
      const fallbackName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
      await set(profileRef, {
        uid: user.uid,
        name: fallbackName,
        email: user.email || "",
      });
    }
    loadRegisteredUsers();
  } catch (error) {
    console.error("Could not load your user profile:", error);
    usersListEl.textContent = "Unable to load users. Check your Realtime Database rules and connection.";
  }
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    logoutBtn.disabled = false;
  }
});

function loadRegisteredUsers() {
  if (unsubscribeUsers) unsubscribeUsers();

  unsubscribeUsers = onValue(ref(db, "users"), (snapshot) => {
    usersListEl.replaceChildren();
    const usersData = snapshot.val();

    if (!usersData) {
      usersListEl.textContent = "No registered users yet.";
      return;
    }

    const ownProfile = usersData[currentUser.uid];
    if (ownProfile?.name) currentUserNameEl.textContent = ownProfile.name;

    usersCache = Object.values(usersData).filter((u) => u && u.uid && u.uid !== currentUser.uid);
    if (usersCache.length === 0) {
      usersListEl.textContent = "No other registered users yet. Create a second account to test chat.";
      return;
    }

    usersCache.sort((a, b) => String(a.name || a.email || "").localeCompare(String(b.name || b.email || "")));
    usersCache.forEach((user) => {
      const userItem = document.createElement("button");
      userItem.type = "button";
      userItem.className = "user-item text-start w-100";
      userItem.classList.toggle("active", selectedUser?.uid === user.uid);

      const nameEl = document.createElement("div");
      nameEl.className = "user-item-name";
      nameEl.textContent = user.name || "Unnamed user";
      const emailEl = document.createElement("div");
      emailEl.className = "user-item-email";
      emailEl.textContent = user.email || "";
      userItem.append(nameEl, emailEl);
      userItem.addEventListener("click", () => selectUser(user, userItem));
      usersListEl.appendChild(userItem);
    });
  }, (error) => {
    console.error("Error reading users:", error);
    usersListEl.textContent = "Unable to read users. Check your Realtime Database rules.";
  });
}

function selectUser(user, clickedElement) {
  selectedUser = user;
  document.querySelectorAll(".user-item").forEach((el) => el.classList.remove("active"));
  clickedElement.classList.add("active");

  noChatSelectedEl.classList.add("hidden");
  chatWindowEl.classList.remove("hidden");
  chatHeaderEl.textContent = user.name || user.email || "Chat";
  chatBox.replaceChildren();
  if (unsubscribeMessages) unsubscribeMessages();

  const [uid1, uid2] = [currentUser.uid, selectedUser.uid].sort();
  const messagesRef = ref(db, `chats/${uid1}/${uid2}/messages`);
  unsubscribeMessages = onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || typeof data.text !== "string") return;
    const messageEl = document.createElement("div");
    messageEl.className = data.senderId === currentUser.uid ? "message sent" : "message received";
    messageEl.textContent = data.text;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, (error) => {
    console.error("Error loading messages:", error);
    chatBox.textContent = "Unable to load messages. Check database rules.";
  });
  messageInput.focus();
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !selectedUser) return;

  const text = messageInput.value.trim();
  if (!text) return;

  const [uid1, uid2] = [currentUser.uid, selectedUser.uid].sort();
  const messagesRef = ref(db, `chats/${uid1}/${uid2}/messages`);
  const sendButton = document.getElementById("send-btn");
  sendButton.disabled = true;

  try {
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      senderId: currentUser.uid,
      receiverId: selectedUser.uid,
      text,
      timestamp: Date.now(),
    });
    messageInput.value = "";
    messageInput.focus();
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Message could not be sent. Check your internet connection and Realtime Database rules.");
  } finally {
    sendButton.disabled = false;
  }
});
