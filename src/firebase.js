// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🧩 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBUOdsN6bpe1_LZShGTdLYb5VUiMLX8jvU",
  authDomain: "emergency-comm.firebaseapp.com",
  projectId: "emergency-comm",
  storageBucket: "emergency-comm.firebasestorage.app",
  messagingSenderId: "33222050455",
  appId: "1:33222050455:web:df9a1b10c10a963f6edfd2",
  measurementId: "G-L42BMH6KBV",
};

// 🚀 Initialize Core Services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 💬 Initialize Messaging
let messaging;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("Firebase Messaging not supported in this environment:", err);
}

// 🔑 Request Notification Permission and Get Token
export const requestForToken = async () => {
  if (!messaging) return;

  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY, // from .env.local
    });

    if (currentToken) {
      console.log("✅ Current FCM token:", currentToken);
      // You can store this token in Firestore under the user’s document
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission first.");
    }
  } catch (err) {
    console.error("An error occurred while retrieving FCM token:", err);
  }
};

// 🔔 Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("🔔 Received foreground message:", payload);
      resolve(payload);
    });
  });

// 🧠 Firestore Collections
export const COLLECTIONS = {
  USERS: "users",
  MESSAGES: "messages",
};

// 👑 Hardcoded Admin (temporary)
export const ADMIN_EMAIL = "admin@project.com";
export const ADMIN_PASSWORD = "adminpassword"; // Change this!
