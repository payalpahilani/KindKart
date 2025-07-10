import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../Utilities/ThemeContext';

export default function DonorsScreen() {
  const { isDarkMode } = useContext(ThemeContext);

  const bg = isDarkMode ? '#0B0B0B' : '#FFFFFF';
  const text = isDarkMode ? '#FFFFFF' : '#20222E';
  const muted = isDarkMode ? '#A7A7A7' : '#555';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Recent Donors</Text>
      <Text style={{ color: muted }}>You don't have any donors yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
});
