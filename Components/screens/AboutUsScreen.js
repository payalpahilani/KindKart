import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function AboutUsScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={28} color={styles.backIcon.color} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>{t('aboutUs.title', 'About KindKart')}</Text>

        {/* Intro Card */}
        <View style={styles.card}>
          <Text style={styles.bodyText}>{t('aboutUs.intro',
            'KindKart is more than just a platform. It’s a movement—a bridge between generous hearts and genuine needs. Whether it\'s helping a family in need, supporting a local charity, or backing grassroots causes, we aim to make generosity easy and meaningful.'
          )}</Text>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <Text style={styles.subheading}>🎯 {t('aboutUs.missionTitle', 'Our Mission')}</Text>
          <Text style={styles.bodyText}>{t('aboutUs.missionBody',
            'To build a transparent and accessible platform where people can donate with confidence and see the real impact of their kindness.'
          )}</Text>
        </View>

        {/* How We Achieve It Card */}
        <View style={styles.card}>
          <Text style={styles.subheading}>🚀 {t('aboutUs.howWeAchieve', 'How We Achieve It')}</Text>
          <Text style={styles.bodyText}>
            {t('aboutUs.featuresList',
              '- Verified campaigns with full transparency\n- User-friendly donation process\n- Real-time updates and stories from beneficiaries\n- Data security and privacy-first design')}
          </Text>
        </View>

        {/* Join Us Card */}
        <View style={styles.card}>
          <Text style={styles.subheading}>🤝 {t('aboutUs.joinUs', 'Join Us')}</Text>
          <Text style={styles.bodyText}>{t('aboutUs.joinUsBody',
            'By using KindKart, you\'re not just giving—you’re becoming part of a compassionate community. Thank you for being here.'
          )}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const base = {
  safe: { flex: 1 },
  backButton: {
    padding: 12,
    marginLeft: 16,
    marginBottom: 8,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  backIcon: { color: '#000' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
  },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#fff' },
  backIcon: { color: '#000' },
  title: { ...base.title, color: '#222' },
  subheading: { ...base.subheading, color: '#444' },
  bodyText: { ...base.bodyText, color: '#555' },
  backButton: { ...base.backButton, backgroundColor: '#F2F2F7' },
  card: {
    ...base.card,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E3E6',
  },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#121212' },
  backIcon: { color: '#fff' },
  title: { ...base.title, color: '#fff' },
  subheading: { ...base.subheading, color: '#ccc' },
  bodyText: { ...base.bodyText, color: '#bbb' },
  backButton: { ...base.backButton, backgroundColor: '#1E1E1E' },
  card: {
    ...base.card,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
});
