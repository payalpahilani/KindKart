import React, { useEffect, useState } from 'react';
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

export default function NgoDonationInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { campaignId } = route.params;

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
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0AB1E7" />
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Campaign not found</Text>
      </SafeAreaView>
    );
  }

  const {
    title,
    imageUrls = [],
    story,
    campaignerName,
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
    : 'Date not available';

  const ngoInitials =
    ngoDetails?.ngoName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'NGO';

  const avatarUri = ngoDetails?.avatarUrl;

  const progress =
    totalDonation && raisedAmount
      ? Math.min((raisedAmount / totalDonation) * 100, 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={26} color="#EFAC3A" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.pageTitle}>Detail Info</Text>

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
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{dateLabel}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category || 'Campaign'}</Text>
          </View>
          {campaignCategory && (
            <View style={[styles.badge, { backgroundColor: '#FFDDCC' }]}>
              <Text style={styles.badgeText}>{campaignCategory.replace('_', ' ')}</Text>
            </View>
          )}
          {urgent && (
            <View style={[styles.badge, { backgroundColor: '#FFD6D6' }]}>
              <Text style={[styles.badgeText, { color: '#B00020' }]}>Urgent</Text>
            </View>
          )}
        </View>

        <Text style={styles.raised}>
          {currency} {raisedAmount?.toLocaleString()} from {currency}{' '}
          {totalDonation?.toLocaleString()}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* NGO Info */}
        <Text style={styles.sectionTitle}>Campaigner</Text>
        <View style={styles.ngoBox}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.ngoAvatar}>
              <Text style={styles.ngoInitials}>{ngoInitials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.ngoName}>{ngoDetails?.ngoName || 'NGO'}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Campaign Story</Text>
        <Text style={styles.story}>{story}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { color: '#EFAC3A', fontWeight: '600', fontSize: 15 },

  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  mainImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  thumbRow: { flexDirection: 'row', marginBottom: 20 },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },

  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  date: { fontSize: 13, color: '#888', marginBottom: 8, },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badge: {
    backgroundColor: '#B8D6DF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: { fontSize: 14, color: '#1F2E41' },

  raised: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
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
    backgroundColor: '#FDFDFD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
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
  ngoInitials: { fontSize: 16, fontWeight: '700', color: '#1F2E41' },
  ngoName: { fontSize: 15, fontWeight: '600' },

  story: { fontSize: 14, color: '#333', lineHeight: 20 },
});
