import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

// Firebase project configuration supplied by Sir.
const firebaseConfig = {
  apiKey: "AIzaSyC5VzOG1qtarTJVFBz5e5IhT4UtYOEMze0",
  authDomain: "smit-projects-firebasehosted.firebaseapp.com",
  databaseURL: "https://smit-projects-firebasehosted-default-rtdb.firebaseio.com",
  projectId: "smit-projects-firebasehosted",
  storageBucket: "smit-projects-firebasehosted.firebasestorage.app",
  messagingSenderId: "950002855052",
  appId: "1:950002855052:web:d0e9f187e074a9303e5fa9",
  measurementId: "G-LSN7YPPMK4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
