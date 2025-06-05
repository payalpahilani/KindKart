import 'react-native-get-random-values';
import { getStorage } from 'firebase/storage';

import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  getAuth as getAuthInstance,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDHM4Uo-Qvq0r0zKnNvzkBBCUwch5CsLsw",
  authDomain: "kindkart-d5cc7.firebaseapp.com",
  projectId: "kindkart-d5cc7",
  storageBucket: "kindkart-d5cc7.appspot.com",
  messagingSenderId: "731786242882",
  appId: "1:731786242882:web:3f4c3647d8de088f8536db"
};

// Initialize app only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth only if not already initialized
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  // fallback if already initialized (should not really throw here)
  auth = getAuthInstance();
}

// Initialize native Auth with persistence only if possible
// (optional) This part depends on your React Native Firebase version
try {
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Auth already initialized, ignore error
  if (e.code !== 'auth/already-initialized') {
    throw e;
  }
}

// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, storage };
