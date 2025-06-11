import React, { useContext } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext';
import i18n from '../../i18n';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const bg = isDarkMode ? '#0B0B0B' : '#F9F9F9';
  const cardBg = isDarkMode ? '#1A1A1C' : '#FFFFFF';
  const cardBor = isDarkMode ? '#2B2B2B' : '#E3E3E3';
  const text = isDarkMode ? '#FFFFFF' : '#20222E';
  const muted = isDarkMode ? '#A7A7A7' : '#757575';
  const accent = '#F6B93B';

  const LangChip = ({ code, label, flag }) => {
    const active = i18n.language === code;
    return (
      <Pressable
        onPress={() => i18n.changeLanguage(code)}
        style={[
          styles.chip,
          {
            backgroundColor: active ? accent : 'transparent',
            borderColor: active ? accent : muted,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? '#fff' : text }]}>
          {flag} {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E1E1E80' : '#FFFFFFCC' }]}
        >
          <Icon name="arrow-left" size={22} color={text} />
        </TouchableOpacity>

        {/* Header */}
        <Text style={[styles.headerText, { color: text }]}>{t('settings.settings')}</Text>

        {/* Appearance Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBor }]}>
          <View style={styles.cardHeader}>
            <Icon name="palette-swatch" size={20} color={accent} />
            <Text style={[styles.cardTitle, { color: text }]}>{t('settings.appearance')}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: muted }]}>{t('settings.dark_mode')}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#2CB67D' }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Language Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBor }]}>
          <View style={styles.cardHeader}>
            <Icon name="translate" size={20} color={accent} />
            <Text style={[styles.cardTitle, { color: text }]}>{t('settings.select_language')}</Text>
          </View>

          <View style={styles.langRow}>
            <LangChip code="en" label="English" flag="🇬🇧" />
            <LangChip code="fr" label="Français" flag="🇫🇷" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
