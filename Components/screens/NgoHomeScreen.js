import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#F3E8DD', '#B8D6DF']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.subtext}>Empowering communities with your kindness</Text>
        </LinearGradient>

        {/* Mission Card */}
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>Fundraising on KindKart takes just a few minutes</Text>

          <View style={styles.verticalMission}>
            <View style={styles.verticalBlockRow}>
              <Feather name="smile" size={18} color="#1F2E41" />
              <Text style={styles.inlineHeading}> Give Happiness</Text>
            </View>
            <Text style={styles.missionText}>
              Giving happiness to others is one of the most fulfilling things you can do in life.
            </Text>

            <View style={styles.verticalBlockRow}>
              <Feather name="heart" size={18} color="#1F2E41" />
              <Text style={styles.inlineHeading}> Share Love</Text>
            </View>
            <Text style={styles.missionText}>
              Sharing love creates a ripple effect of kindness around you.
            </Text>

            <View style={styles.verticalBlockRow}>
              <Feather name="users" size={18} color="#1F2E41" />
              <Text style={styles.inlineHeading}> Build Socially</Text>
            </View>
            <Text style={styles.missionText}>
              Building socially means not just connecting, but contributing.
            </Text>
          </View>
        </View>

        {/* Active Campaigns Carousel */}
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#007B55" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 20 }}
          >
            {campaigns.map((item) => (
              <View key={item.id} style={styles.campaignCard}>
                <Image
                  source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }}
                  style={styles.campaignImage}
                />
                <Text style={styles.campaignTitle}>{item.title}</Text>
                <Text style={styles.campaignProgress}>
                  Raised {item.currency} ${item.raisedAmount?.toLocaleString() || 0} of ${item.totalDonation?.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => navigation.navigate('NgoDonationInfoScreen', { campaignId: item.id })}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.map((item) => (
          <View key={item.id} style={styles.activityItem}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityDetail}>{item.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: { fontSize: 22, fontWeight: '700', color: '#1F2E41' },
  subtext: { fontSize: 14, color: '#555', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2E41',
    marginTop: 30,
    marginBottom: 12,
    marginLeft: 20,
  },
  campaignCard: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
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
    color: '#1F2E41',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  campaignProgress: {
    fontSize: 14,
    color: '#777',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8DD',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 12,
    marginTop: 6,
  },
  viewButtonText: {
    color: '#1F2E41',
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  activityDetail: { fontSize: 14, color: '#666', marginTop: 4 },
  missionCard: {
    backgroundColor: '#DDEDF4',
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
    color: '#1F2E41',
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
    color: '#1F2E41',
    marginLeft: 6,
  },
  missionText: {
    fontSize: 12,
    color: '#1F2E41',
    lineHeight: 16,
    marginBottom: 12,
  },
});
