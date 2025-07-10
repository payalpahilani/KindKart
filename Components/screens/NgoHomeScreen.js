import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const recentActivities = [
  { id: 'a1', title: 'Donation Received', detail: 'CAD $200 from Sarah' },
  { id: 'a2', title: 'Campaign Approved', detail: 'Clean Water Project' },
  { id: 'a3', title: 'Donation Received', detail: 'CAD $350 from John' },
];

export default function NgoHomeScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const bg = isDarkMode ? '#0B0B0B' : '#FFFFFF';
  const cardBg = isDarkMode ? '#1A1A1C' : '#FFFFFF';
  const cardBor = isDarkMode ? '#2B2B2B' : '#E3E3E3';
  const text = isDarkMode ? '#FFFFFF' : '#20222E';
  const muted = isDarkMode ? '#A7A7A7' : '#757575';
  const accent = '#F6B93B';

  useFocusEffect(
    useCallback(() => {
      const fetchCampaigns = async () => {
        try {
          const userId = auth.currentUser?.uid;
          if (!userId) return;

          const q = query(collection(db, 'campaigns'), where('createdBy', '==', userId));
          const snapshot = await getDocs(q);
          const results = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status !== 'closed') {
              results.push({ id: doc.id, ...data });
            }
          });
          setCampaigns(results);
        } catch (err) {
          console.error('Failed to fetch campaigns:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchCampaigns();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}> 
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#F3E8DD', '#B8D6DF']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.welcome, { color: text }]}>{t('NgoHome.welcome')}</Text>
          <Text style={[styles.subtext, { color: muted }]}>{t('NgoHome.subtext')}</Text>
        </LinearGradient>

        <View style={[styles.missionCard, { backgroundColor: isDarkMode ? '#262B35' : '#DDEDF4' }]}>
          <Text style={[styles.missionTitle, { color: text }]}>{t('NgoHome.missionTitle')}</Text>

          <View style={styles.verticalMission}>
            <View style={styles.verticalBlockRow}>
              <Feather name="smile" size={18} color={accent} />
              <Text style={[styles.inlineHeading, { color: text }]}>{t('NgoHome.happinessTitle')}</Text>
            </View>
            <Text style={[styles.missionText, { color: muted }]}>{t('NgoHome.happinessText')}</Text>

            <View style={styles.verticalBlockRow}>
              <Feather name="heart" size={18} color={accent} />
              <Text style={[styles.inlineHeading, { color: text }]}>{t('NgoHome.loveTitle')}</Text>
            </View>
            <Text style={[styles.missionText, { color: muted }]}>{t('NgoHome.loveText')}</Text>

            <View style={styles.verticalBlockRow}>
              <Feather name="users" size={18} color={accent} />
              <Text style={[styles.inlineHeading, { color: text }]}>{t('NgoHome.socialTitle')}</Text>
            </View>
            <Text style={[styles.missionText, { color: muted }]}>{t('NgoHome.socialText')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: text }]}>{t('NgoHome.activeCampaigns')}</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={accent} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 20 }}
          >
            {campaigns.map((item) => (
              <View key={item.id} style={[styles.campaignCard, { backgroundColor: cardBg, shadowColor: text }]}>
                <Image
                  source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }}
                  style={styles.campaignImage}
                />
                <Text style={[styles.campaignTitle, { color: text }]}>{item.title}</Text>
                <Text style={[styles.campaignProgress, { color: muted }]}> 
                  {t('NgoHome.raised')} {item.currency} ${item.raisedAmount?.toLocaleString() || 0} {t('NgoHome.of')} ${item.totalDonation?.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: isDarkMode ? '#3A3B3C' : '#F3E8DD' }]}
                  onPress={() => navigation.navigate('NgoDonationInfoScreen', { campaignId: item.id })}
                >
                  <Text style={[styles.viewButtonText, { color: text }]}>{t('NgoHome.view')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={[styles.sectionTitle, { color: text }]}>{t('NgoHome.recentActivity')}</Text>
        {recentActivities.map((item) => (
          <View key={item.id} style={[styles.activityItem, { backgroundColor: cardBg }]}>
            <Text style={[styles.activityTitle, { color: text }]}>{item.title}</Text>
            <Text style={[styles.activityDetail, { color: muted }]}>{item.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: { fontSize: 22, fontWeight: '700' },
  subtext: { fontSize: 14, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 12,
    marginLeft: 20,
  },
  campaignCard: {
    width: width * 0.7,
    borderRadius: 18,
    marginRight: 16,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    paddingBottom: 12,
  },
  campaignImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  campaignProgress: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 12,
    marginTop: 6,
  },
  viewButtonText: {
    fontWeight: '600',
  },
  activityItem: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  activityTitle: { fontSize: 16, fontWeight: '600' },
  activityDetail: { fontSize: 14, marginTop: 4 },
  missionCard: {
    margin: 20,
    marginBottom: 5,
    borderRadius: 16,
    padding: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  verticalMission: {
    marginTop: 12,
  },
  verticalBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inlineHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  missionText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
});
