// Components/screens/HomeScreen.js
import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = () => {
    signOut(auth).then(() => navigation.replace('Login'));
  };

  const openChatList = () => {
    navigation.navigate('ChatList');   
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with chat icon */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KindKart</Text>

        <TouchableOpacity onPress={openChatList} style={styles.chatIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={styles.body}>
        <Text style={styles.welcome}>
          Hello, {user?.displayName || user?.email}!
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  /* header */
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1F2E41',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  chatIcon: {
    backgroundColor: '#EFAC3A',
    borderRadius: 20,
    padding: 8,
  },

  /* body */
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcome: { fontSize: 20, color: '#1F2E41', textAlign: 'center' },

  /* logout */
  logoutButton: {
    alignSelf: 'center',
    marginBottom: 40,
    backgroundColor: '#EFAC3A',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  logoutText: { color: '#1F2E41', fontWeight: '600', fontSize: 16 },
});
