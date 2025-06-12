import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NgoProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NGO Profile</Text>
      <Text>Organization details and settings will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
});
