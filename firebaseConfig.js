// firebaseConfig.js
import "react-native-get-random-values";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHM4Uo-Qvq0r0zKnNvzkBBCUwch5CsLsw",
  authDomain: "kindkart-d5cc7.firebaseapp.com",
  projectId: "kindkart-d5cc7",
  storageBucket: "kindkart-d5cc7.appspot.com",
  messagingSenderId: "731786242882",
  appId: "1:731786242882:web:3f4c3647d8de088f8536db",
};

// Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with persistence (Expo/React Native)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Export for use in your app
export { auth, db, storage };
