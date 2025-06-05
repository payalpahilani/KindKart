import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function AboutUsScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color={styles.backIcon.color} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About KindKart</Text>

        <Text style={styles.bodyText}>
          KindKart is more than just a platform. It’s a movement—a bridge between generous hearts
          and genuine needs. Whether it's helping a family in need, supporting a local charity, or
          backing grassroots causes, we aim to make generosity easy and meaningful.
        </Text>

        <Text style={styles.subheading}>🎯 Our Mission</Text>
        <Text style={styles.bodyText}>
          To build a transparent and accessible platform where people can donate with confidence and
          see the real impact of their kindness.
        </Text>

        <Text style={styles.subheading}>🚀 How We Achieve It</Text>
        <Text style={styles.bodyText}>
          - Verified campaigns with full transparency{'\n'}
          - User-friendly donation process{'\n'}
          - Real-time updates and stories from beneficiaries{'\n'}
          - Data security and privacy-first design
        </Text>

        <Text style={styles.subheading}>🤝 Join Us</Text>
        <Text style={styles.bodyText}>
          By using KindKart, you're not just giving—you’re becoming part of a compassionate
          community. Thank you for being here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const base = {
  safe: { flex: 1 },
  backButton: { padding: 10 },
  backIcon: { color: '#000' },
  content: { padding: 20, paddingTop: 10 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  subheading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  bodyText: { fontSize: 16, lineHeight: 24 },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#fff' },
  backIcon: { color: '#000' },
  title: { ...base.title, color: '#000' },
  subheading: { ...base.subheading, color: '#333' },
  bodyText: { ...base.bodyText, color: '#444' },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#121212' },
  backIcon: { color: '#fff' },
  title: { ...base.title, color: '#fff' },
  subheading: { ...base.subheading, color: '#ccc' },
  bodyText: { ...base.bodyText, color: '#bbb' },
});
