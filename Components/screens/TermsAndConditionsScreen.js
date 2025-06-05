import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const TermsAndConditionsScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Terms and Conditions</Text>

      <Text style={styles.paragraph}>
        Welcome to KindKart. By accessing or using this app, you agree to be bound by these Terms and Conditions. If you do not agree with any part, please do not use the app.
      </Text>

      <Text style={styles.subHeader}>1. User Responsibilities</Text>
      <Text style={styles.paragraph}>
        You are responsible for maintaining the confidentiality of your account and password, and for restricting access to your device.
      </Text>

      <Text style={styles.subHeader}>2. Content</Text>
      <Text style={styles.paragraph}>
        Users are solely responsible for the content they post. Inappropriate, offensive, or illegal content is strictly prohibited.
      </Text>

      <Text style={styles.subHeader}>3. Prohibited Use</Text>
      <Text style={styles.paragraph}>
        You agree not to use the app for any unlawful purpose or in any way that may damage, disable, or impair the app.
      </Text>

      <Text style={styles.subHeader}>4. Modification of Terms</Text>
      <Text style={styles.paragraph}>
        We reserve the right to change these terms at any time. Continued use of the app implies acceptance of the updated terms.
      </Text>

      <Text style={styles.subHeader}>5. Contact Us</Text>
      <Text style={styles.paragraph}>
        For questions about these Terms and Conditions, please contact us at support@kindkart.app.
      </Text>

      <Text style={styles.footer}>Last updated: June 5, 2025</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#222',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default TermsAndConditionsScreen;
