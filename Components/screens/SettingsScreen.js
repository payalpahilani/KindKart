import React, { useContext, useEffect, useState } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { ThemeContext } from '../Utilities/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  const userId = auth.currentUser?.uid;

  // Notification settings state & Firestore persistence
  const [notificationSettings, setNotificationSettings] = useState({
    turnOnNotifications: true,
    newCampaignAlert: true,
    donationReminder: true,
    thankYouMessage: true,
    milestoneUpdate: true,
    newNgoPartner: true,
    buyerSellerMessages: true,
  });

  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.notificationSettings) {
            setNotificationSettings(data.notificationSettings);
          }
        }
      } catch (err) {
        console.log('Error loading notification settings:', err);
      }
    };

    loadSettings();
  }, [userId]);

  const toggleSetting = async (key) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);

    try {
      if (!userId) throw new Error('User not logged in');
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, { notificationSettings: newSettings }, { merge: true });
    } catch (err) {
      Alert.alert('Error', 'Failed to update notification settings.');
      console.log(err);
    }
  };

  // Language chip component
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

  // Handlers for About, Rating, Terms:
  const handleAbout = () => {
    navigation.navigate('AboutUsScreen');
  };

  const handleRating = () => {
    Alert.alert(
      t('settings.giveRating'),
      t('settings.rateAppPrompt'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: () => {
            Linking.openURL('https://appstore.com/yourapp'); // Replace with your app store URL
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleTerms = () => {
    navigation.navigate('TermsAndConditions');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E1E1E80' : '#FFFFFFCC' }]}
        >
          <Icon name="arrow-left" size={22} color={text} />
        </TouchableOpacity>

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

        {/* Notifications Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBor }]}>
          <View style={styles.cardHeader}>
            <Icon name="bell-outline" size={20} color={accent} />
            <Text style={[styles.cardTitle, { color: text }]}>Notifications</Text>
          </View>

          {/* Master toggle */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: muted }]}>Turn On Notifications</Text>
            <Switch
              value={notificationSettings.turnOnNotifications}
              onValueChange={() => toggleSetting('turnOnNotifications')}
              trackColor={{ false: '#767577', true: '#2CB67D' }}
              thumbColor={notificationSettings.turnOnNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Individual toggles */}
          {notificationSettings.turnOnNotifications && (
            <>
              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>New Campaign Alert</Text>
                <Switch
                  value={notificationSettings.newCampaignAlert}
                  onValueChange={() => toggleSetting('newCampaignAlert')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.newCampaignAlert ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>Donation Reminder</Text>
                <Switch
                  value={notificationSettings.donationReminder}
                  onValueChange={() => toggleSetting('donationReminder')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.donationReminder ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>Thank You Message</Text>
                <Switch
                  value={notificationSettings.thankYouMessage}
                  onValueChange={() => toggleSetting('thankYouMessage')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.thankYouMessage ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>Milestone Update</Text>
                <Switch
                  value={notificationSettings.milestoneUpdate}
                  onValueChange={() => toggleSetting('milestoneUpdate')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.milestoneUpdate ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>New NGO Partner</Text>
                <Switch
                  value={notificationSettings.newNgoPartner}
                  onValueChange={() => toggleSetting('newNgoPartner')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.newNgoPartner ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: muted }]}>Messages from Buyer/Seller</Text>
                <Switch
                  value={notificationSettings.buyerSellerMessages}
                  onValueChange={() => toggleSetting('buyerSellerMessages')}
                  trackColor={{ false: '#767577', true: '#2CB67D' }}
                  thumbColor={notificationSettings.buyerSellerMessages ? '#fff' : '#f4f3f4'}
                />
              </View>
            </>
          )}
        </View>

        {/* About, Rating, Terms Cards */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: cardBg, borderColor: cardBor }]}
          onPress={handleAbout}
        >
          <View style={styles.cardLeft}>
            <Icon name="information-outline" size={22} color={text} />
            <Text style={[styles.optionText, { color: text, marginLeft: 16 }]}>
              {t('settings.aboutApp')}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: cardBg, borderColor: cardBor }]}
          onPress={handleRating}
        >
          <View style={styles.cardLeft}>
            <Icon name="star-outline" size={22} color={text} />
            <Text style={[styles.optionText, { color: text, marginLeft: 16 }]}>
              {t('settings.giveRating')}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: cardBg, borderColor: cardBor }]}
          onPress={handleTerms}
        >
          <View style={styles.cardLeft}>
            <Icon name="file-document-outline" size={22} color={text} />
            <Text style={[styles.optionText, { color: text, marginLeft: 16 }]}>
              {t('settings.termsConditions')}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={muted} />
        </TouchableOpacity>
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
    marginBottom: 12,
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

  optionCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
