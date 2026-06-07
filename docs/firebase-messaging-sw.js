// ─── Firebase Messaging Service Worker ──────────────────────────────
// This file handles push notifications when the app is closed or in
// the background. Firebase requires it to be named exactly this.

// Import Firebase scripts so this service worker can use Firebase
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Connect to the same Firebase project as the main app
firebase.initializeApp({
  apiKey:            "AIzaSyCXN2BuSWnp3yr_IWeCWa-oBFaJq_mVbuM",
  authDomain:        "my-to-do-list-7ffb4.firebaseapp.com",
  projectId:         "my-to-do-list-7ffb4",
  storageBucket:     "my-to-do-list-7ffb4.firebasestorage.app",
  messagingSenderId: "79970970976",
  appId:             "1:79970970976:web:44da3354cd38419b8dc205",
});

const messaging = firebase.messaging();

// This runs when a push notification arrives and the app is NOT open.
// It shows the notification as a system alert on the device.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'My To-Do List';
  const body  = payload.notification?.body  || 'You have an upcoming event!';

  self.registration.showNotification(title, {
    body,
    icon: './icon.svg',
  });
});
