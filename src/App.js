// src/App.js
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import ChatInterface from "./components/ChatInterface";
import {
  auth,
  db,
  COLLECTIONS,
  ADMIN_EMAIL,
  requestForToken,
  onMessageListener,
} from "./firebase";
import "./App.css";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notification, setNotification] = useState(null);

  // 🌗 Apply theme globally
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 🔥 Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, COLLECTIONS.USERS, user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserProfile({ uid: user.uid, ...docSnap.data() });
          } else if (user.email === ADMIN_EMAIL) {
            setUserProfile({ uid: user.uid, userType: "admin", name: "Admin" });
          } else {
            console.warn("User profile not found in Firestore.");
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🪄 Firebase Cloud Messaging Setup
  useEffect(() => {
    requestForToken(); // Requests permission + retrieves device token

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        console.log("📩 Received foreground message:", payload);
        setNotification({
          title: payload?.notification?.title,
          body: payload?.notification?.body,
        });
      })
      .catch((err) => console.error("Notification listener error:", err));
  }, []);

  // 🧭 Logout Function
  const handleLogout = () => {
    signOut(auth).catch((err) => console.error("Logout Error:", err));
  };

  if (loading) return <div className="loading">Loading...</div>;

  // 🧱 Login/Register Screen
  if (!currentUser)
    return (
      <div className="app-container">
        {isLoginView ? (
          <Login switchPage={() => setIsLoginView(false)} />
        ) : (
          <Register switchPage={() => setIsLoginView(true)} />
        )}
      </div>
    );

  const isAdmin = userProfile?.userType === "admin";

  return (
    <div className={`app-container ${theme}`}>
      {/* === Header === */}
      <header className="header">
        <h1>{(userProfile?.userType || "User").toUpperCase()} Dashboard</h1>

        <div className="header-buttons">
          <button
            className="btn theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <button className="btn logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* === Notification Popup === */}
      {notification && (
        <div className="notification-popup">
          <h4>{notification.title}</h4>
          <p>{notification.body}</p>
          <button onClick={() => setNotification(null)}>Close</button>
        </div>
      )}

      {/* === Main Section === */}
      <main className="main-content">
        {isAdmin && <AdminDashboard currentUser={currentUser} theme={theme} />}

        {(userProfile?.userType === "student" ||
          userProfile?.userType === "parent") && (
          <ChatInterface currentUser={userProfile} theme={theme} />
        )}
      </main>
    </div>
  );
}

export default App;
