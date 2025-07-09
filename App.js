import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from "./Navigation/AppNavigator";
import { ThemeProvider } from "./Components/Utilities/ThemeContext";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';1
import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import { StripeProvider } from "@stripe/stripe-react-native";

import './i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NotificationHandler() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notifications!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);

      const userId = auth.currentUser?.uid;
      if (userId && token) {
        try {
          await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
        } catch (error) {
          console.error('Error saving token to Firestore:', error);
        }
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } else {
      Alert.alert('Must use physical device for push notifications');
    }
    return token;
  }

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <ThemeProvider>
          <NotificationHandler />
          <AppNavigator />
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
