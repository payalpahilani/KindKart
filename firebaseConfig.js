// firebaseConfig.js
// ① Crypto polyfill must be first.
import 'react-native-get-random-values';

import { initializeApp } from 'firebase/app';
// ② Use the React Native entrypoint for auth:
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDHM4Uo-Qvq0r0zKnNvzkBBCUwch5CsLsw",
  authDomain: "kindkart-d5cc7.firebaseapp.com",
  projectId: "kindkart-d5cc7",
  storageBucket: "kindkart-d5cc7.appspot.com",
  messagingSenderId: "731786242882",
  appId: "1:731786242882:web:3f4c3647d8de088f8536db"
};

// 1️⃣ Initialize the Firebase JS SDK
const app = initializeApp(firebaseConfig);

// 2️⃣ Immediately register the native Auth component
initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// 3️⃣ Export the auth instance
export const auth = getAuth(app);
