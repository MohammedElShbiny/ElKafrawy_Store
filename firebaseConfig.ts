
// !!! IMPORTANT !!!
// This configuration connects your app to the "elkafrawy-store" Firebase project.
// Ensure you have created the Firestore Database in the console as described in FIREBASE_SETUP.md

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAqcjaC80EGefIYOGH937YxI2ERe5PIrac",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "elkafrawy-store.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "elkafrawy-store",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "elkafrawy-store.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "329603667597",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:329603667597:web:157d32d3f96c2c2253f4c4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R39RCZFEN0"
};

export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
};
