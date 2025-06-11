import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';

const TermsAndConditionsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const bgColor = isDarkMode ? '#121212' : '#fff';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const subHeaderColor = isDarkMode ? '#ccc' : '#222';
  const paragraphColor = isDarkMode ? '#aaa' : '#555';
  const cardBg = isDarkMode ? '#1E1E1E' : '#fafafa';

const sections = [
  t('terms.sections.user', { returnObjects: true }),
  t('terms.sections.content', { returnObjects: true }),
  t('terms.sections.prohibited', { returnObjects: true }),
  t('terms.sections.modification', { returnObjects: true }),
  t('terms.sections.contact', { returnObjects: true }),
];


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.header, { color: textColor }]}>{t('terms.title')}</Text>

        <Text style={[styles.paragraph, { color: paragraphColor }]}>
          {t('terms.intro')}
        </Text>

        {sections.map((section, i) => (
          <View key={i} style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.subHeader, { color: subHeaderColor }]}>{section.title}</Text>
            <Text style={[styles.paragraph, { color: paragraphColor }]}>{section.text}</Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: paragraphColor }]}>
          {t('terms.sections.lastUpdated')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    padding: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    fontSize: 14,
    marginTop: 30,
    textAlign: 'center',
  },
});

export default TermsAndConditionsScreen;
