import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../Utilities/ThemeContext'; // your ThemeContext
import { useTranslation } from 'react-i18next';  // import i18n

export default function NgoDonationInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { campaignId } = route.params;

  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ngoDetails, setNgoDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const campaignData = docSnap.data();
          setCampaign(campaignData);

          if (campaignData.imageUrls?.length > 0) {
            setSelectedImage({ uri: campaignData.imageUrls[0] });
          }

          if (campaignData.createdBy) {
            const ngoRef = doc(db, 'ngo', campaignData.createdBy);
            const ngoSnap = await getDoc(ngoRef);
            if (ngoSnap.exists()) {
              setNgoDetails(ngoSnap.data());
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch campaign details:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
        <ActivityIndicator size="large" color="#0AB1E7" />
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          {t('ngoDonation.campaignNotFound')}
        </Text>
      </SafeAreaView>
    );
  }

  const {
    title,
    imageUrls = [],
    story,
    campaignCategory,
    category,
    currency = 'CAD',
    totalDonation,
    raisedAmount = 0,
    campaignDate,
    urgent,
  } = campaign;

  const thumbnails = imageUrls.map((url, i) => (
    <TouchableOpacity key={i} onPress={() => setSelectedImage({ uri: url })}>
      <Image source={{ uri: url }} style={styles.thumb} />
    </TouchableOpacity>
  ));

  const dateLabel = campaignDate
    ? new Date(campaignDate).toDateString()
    : t('ngoDonation.dateNotAvailable');

  const ngoInitials =
    ngoDetails?.ngoName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'NGO';

  const avatarUri = ngoDetails?.avatarUrl;

  const progress =
    totalDonation && raisedAmount
      ? Math.min((raisedAmount / totalDonation) * 100, 100)
      : 0;

  // Colors for dark mode
  const bg = isDarkMode ? '#121212' : '#fff';
  const textColor = isDarkMode ? '#E1E1E1' : '#1F2E41';
  const subTextColor = isDarkMode ? '#A0A0A0' : '#888';
  const badgeBg = isDarkMode ? '#2A3942' : '#B8D6DF';
  const badgeTextColor = isDarkMode ? '#E1E1E1' : '#1F2E41';
  const urgentBadgeBg = isDarkMode ? '#5B2C2C' : '#FFD6D6';
  const urgentBadgeTextColor = isDarkMode ? '#FF9494' : '#B00020';
  const raisedTextColor = isDarkMode ? '#C6D3DF' : '#333';
  const ngoBoxBg = isDarkMode ? '#1E1E1E' : '#FDFDFD';
  const ngoBorderColor = isDarkMode ? '#333' : '#eee';
  const progressTrackBg = isDarkMode ? '#333' : '#eee';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={26} color="#EFAC3A" />
          <Text style={[styles.backText, { color: textColor }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.pageTitle, { color: textColor }]}>{t('ngoDonation.detailInfo')}</Text>

        {/* Main Image */}
        <Image
          source={selectedImage || require('../../assets/Images/campaign1.jpg')}
          style={styles.mainImage}
        />

        {/* Thumbnails */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {thumbnails}
        </ScrollView>

        {/* Campaign Meta */}
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={[styles.date, { color: subTextColor }]}>{dateLabel}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>
              {category || t('ngoDonation.campaign')}
            </Text>
          </View>
          {campaignCategory && (
            <View style={[styles.badge, { backgroundColor: '#FFDDCC' }]}>
              <Text style={styles.badgeText}>
                {campaignCategory.replace('_', ' ')}
              </Text>
            </View>
          )}
          {urgent && (
            <View style={[styles.badge, { backgroundColor: urgentBadgeBg }]}>
              <Text style={[styles.badgeText, { color: urgentBadgeTextColor }]}>
                {t('ngoDonation.urgent')}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.raised, { color: raisedTextColor }]}>
          {currency} {raisedAmount?.toLocaleString()} {t('ngoDonation.from')} {currency}{' '}
          {totalDonation?.toLocaleString()}
        </Text>

        <View style={[styles.progressTrack, { backgroundColor: progressTrackBg }]}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* NGO Info */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('ngoDonation.campaigner')}</Text>
        <View style={[styles.ngoBox, { backgroundColor: ngoBoxBg, borderColor: ngoBorderColor }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.ngoAvatar}>
              <Text style={[styles.ngoInitials, { color: badgeTextColor }]}>{ngoInitials}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.ngoName, { color: textColor }]}>{ngoDetails?.ngoName || 'NGO'}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('ngoDonation.campaignStory')}</Text>
        <Text style={[styles.story, { color: textColor }]}>{story}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { fontWeight: '600', fontSize: 15 },

  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  mainImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  thumbRow: { flexDirection: 'row', marginBottom: 20 },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },

  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  date: { fontSize: 13, marginBottom: 8 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: { fontSize: 16, color: '#1F2E41' },

  raised: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0AB1E7',
  },

  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  ngoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  ngoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B8D6DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  ngoInitials: { fontSize: 16, fontWeight: '700' },
  ngoName: { fontSize: 15, fontWeight: '600' },

  story: { fontSize: 14, lineHeight: 20 },
});
