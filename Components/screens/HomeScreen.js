import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.replace('Login');
    });
  };

  const goToChat = () => {
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Hello, {user?.displayName || user?.email}!
      </Text>

      {/* Chat Icon Button */}
      <TouchableOpacity onPress={goToChat} style={styles.chatIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color="#EFAC3A" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 20,
  },
  welcome: {
    fontSize: 20, marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#EFAC3A',
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
  },
  logoutText: {
    color: '#1F2E41', fontWeight: '600',
  },
  chatIcon: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#1F2E41',
    padding: 10,
    borderRadius: 50,
  },
});
