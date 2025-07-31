import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function DonationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const campaignId = route?.params?.campaignId;

  if (!campaignId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No campaign selected.</Text>
      </SafeAreaView>
    );
  }

  const formatBadge = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.label || val.value || JSON.stringify(val);
    return String(val);
  };
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const styles = isDarkMode ? darkStyles : lightStyles;

  const [campaign, setCampaign] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchCampaignAndNgo = async () => {
        setLoading(true);
        try {
          const campaignRef = doc(db, 'campaigns', campaignId);
          const campaignSnap = await getDoc(campaignRef);
  
          if (campaignSnap.exists()) {
            const data = campaignSnap.data();
            setCampaign(data);
            if (data.imageUrls?.length > 0) {
              setSelectedImage({ uri: data.imageUrls[0] });
            }
  
            if (data.createdBy) {
              const ngoRef = doc(db, 'ngo', data.createdBy);
              const ngoSnap = await getDoc(ngoRef);
              if (ngoSnap.exists()) {
                setNgo(ngoSnap.data());
              }
            }
          }
        } catch (err) {
          console.warn('Error fetching campaign/NGO:', err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchCampaignAndNgo();
    }, [campaignId])
  );

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
        <Text>{t('donationDetail.campaignNotFound')}</Text>
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
    daysLeft,
    urgent,
    campaignDate,
  } = campaign;

  const progress = totalDonation ? Math.min((raisedAmount / totalDonation) * 100, 100) : 0;


  const ngoInitials = ngo?.ngoName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const thumbnails = imageUrls.map((url, index) => (
    <TouchableOpacity key={index} onPress={() => setSelectedImage({ uri: url })}>
      <Image source={{ uri: url }} style={styles.thumb} />
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={isDarkMode ? '#121212' : '#fff'} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={26} color="#EFAC3A" />
          <Text style={styles.backText}>{t('donationDetail.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{t('donationDetail.campaignDetails')}</Text>

        <Image
          source={selectedImage || require('../../assets/Images/campaign1.jpg')}
          style={styles.mainImage}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {thumbnails}
        </ScrollView>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>
          {campaignDate ? new Date(campaignDate).toDateString() : t('donationDetail.dateNotAvailable')}
        </Text>


        <View style={styles.badgeRow}>
  {category && (
    <View style={[styles.badge, { backgroundColor: '#C8F4E5' }]}>
      <Text style={styles.badgeText}>{formatBadge(category)}</Text>
    </View>
  )}
  {campaignCategory && (
    <View style={[styles.badge, { backgroundColor: '#FFDDCC' }]}>
      <Text style={styles.badgeText}>
        {formatBadge(
          typeof campaignCategory === 'string'
            ? campaignCategory.replace(/_/g, ' ')
            : campaignCategory
        )}
      </Text>
    </View>
  )}
  {urgent && (
    <View style={[styles.badge, { backgroundColor: '#FFD6D6' }]}>
      <Text style={[styles.badgeText, { color: '#B00020' }]}>
        {t('donationDetail.urgent')}
      </Text>
    </View>
  )}
</View>


        <Text style={styles.raised}>
          {currency} {raisedAmount.toLocaleString()} {t('donationDetail.from')} {currency}{' '}
          {totalDonation?.toLocaleString()}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Campaigner */}
        <Text style={styles.sectionTitle}>{t('donationDetail.campaigner')}</Text>
        <View style={styles.ngoBox}>
          {ngo?.avatarUrl ? (
            <Image source={{ uri: ngo.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.ngoAvatar}>
              <Text style={styles.ngoInitials}>{ngoInitials || 'NGO'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.ngoName}>{ngo?.ngoName || 'NGO'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('donationDetail.campaignStory')}</Text>
        <Text style={styles.story}>{story}</Text>

        <TouchableOpacity
          style={styles.donateButton}
          onPress={() =>
            navigation.navigate('PaymentScreen', {
              campaignId,
              title,
              ngoName: ngo?.ngoName,
              ngoId: ngo?.uid,
              currency,
              imageUrls,
            })
          }
        >
          <Text style={styles.donateButtonText}>{t('donationDetail.donateNow')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = {
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
  badgeText: { fontSize: 16 },

  raised: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
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

  donateButton: {
    padding: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#fff' },
  backText: { ...baseStyles.backText, color: '#EFAC3A' },
  pageTitle: { ...baseStyles.pageTitle, color: '#222' },
  date: { ...baseStyles.date, color: '#888' },
  badge: { ...baseStyles.badge, backgroundColor: '#B8D6DF' },
  badgeText: { ...baseStyles.badgeText, color: '#1F2E41' },
  raised: { ...baseStyles.raised, color: '#333' },
  progressTrack: { ...baseStyles.progressTrack, backgroundColor: '#eee' },
  progressBar: { ...baseStyles.progressBar, backgroundColor: '#0AB1E7' },
  sectionTitle: { ...baseStyles.sectionTitle, color: '#222' },
  ngoBox: { ...baseStyles.ngoBox, backgroundColor: '#FDFDFD', borderColor: '#eee' },
  ngoAvatar: { ...baseStyles.ngoAvatar, backgroundColor: '#B8D6DF' },
  ngoInitials: { ...baseStyles.ngoInitials, color: '#1F2E41' },
  story: { ...baseStyles.story, color: '#333' },
  donateButton: { ...baseStyles.donateButton, backgroundColor: '#F6B93B' },
  donateButtonText: { ...baseStyles.donateButtonText, color: '#fff' },
  backBtn: { ...baseStyles.backBtn },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#121212' },
  backText: { ...baseStyles.backText, color: '#FFB74D' },          
  pageTitle: { ...baseStyles.pageTitle, color: '#FFFFFF' },     
  title: { ...baseStyles.title, color: '#FFFFFF' },   
  date: { ...baseStyles.date, color: '#CCCCCC' },                 
  badge: { ...baseStyles.badge, backgroundColor: '#444' },
  badgeText: { ...baseStyles.badgeText, color: '#393E46' },        
  raised: { ...baseStyles.raised, color: '#E0E0E0' },             
  progressTrack: { ...baseStyles.progressTrack, backgroundColor: '#333' },
  progressBar: { ...baseStyles.progressBar, backgroundColor: '#0AB1E7' },
  sectionTitle: { ...baseStyles.sectionTitle, color: '#FFFFFF' },  
  ngoBox: { ...baseStyles.ngoBox, backgroundColor: '#1e1e1e', borderColor: '#555' },
  ngoAvatar: { ...baseStyles.ngoAvatar, backgroundColor: '#555' },
  ngoInitials: { ...baseStyles.ngoInitials, color: '#FFFFFF' },    
  ngoName: { ...baseStyles.ngoName, color: '#E0E0E0' },            
  story: { ...baseStyles.story, color: '#DDD' },                   
  donateButton: { ...baseStyles.donateButton, backgroundColor: '#F6B93B' },
  donateButtonText: { ...baseStyles.donateButtonText, color: '#121212' }, 
  backBtn: { ...baseStyles.backBtn },
});

