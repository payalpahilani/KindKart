import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DonorsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Donors</Text>
      <Text>You don't have any donors yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
});
