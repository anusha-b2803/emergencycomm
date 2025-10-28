importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBUOdsN6bpe1_LZShGTdLYb5VUiMLX8jvU",
  authDomain: "emergency-comm.firebaseapp.com",
  projectId: "emergency-comm",
  storageBucket: "emergency-comm.firebasestorage.app",
  messagingSenderId: "33222050455",
  appId: "1:33222050455:web:df9a1b10c10a963f6edfd2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
