import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export default function DonorsScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = isDarkMode ? '#121212' : '#FFFFFF';
  const text = isDarkMode ? '#FFFFFF' : '#20222E';
  const muted = isDarkMode ? '#A7A7A7' : '#555';
  const cardBg = isDarkMode ? '#1F1F1F' : '#F5F5F5';

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        const ngoId = auth.currentUser?.uid;
        if (!ngoId) return;

        console.log("👤 Logged-in NGO ID:", ngoId);

        // Step 1: Get campaigns created by this NGO
        const campaignsQuery = query(collection(db, 'campaigns'), where('createdBy', '==', ngoId));
        const campaignSnapshot = await getDocs(campaignsQuery);
        const campaignIds = campaignSnapshot.docs.map(doc => doc.id);

        console.log("📦 Campaigns owned by NGO:", campaignIds);

        if (campaignIds.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Step 2: Get all donations for these campaigns
        const donationsQuery = query(collection(db, 'donations'), where('campaignId', 'in', campaignIds));
        const donationsSnapshot = await getDocs(donationsQuery);

        const allDonations = donationsSnapshot.docs.map(doc => doc.data());

        console.log("💸 Donations found:", allDonations);

        // Step 3: Aggregate total amount donated per user
        const totals = {};
        for (const donation of allDonations) {
          if (!donation.userId || !donation.amount) continue;
          totals[donation.userId] = (totals[donation.userId] || 0) + donation.amount;
        }

        // Step 4: Fetch user info for top donors
        const topDonors = await Promise.all(
          Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(async ([userId, total]) => {
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);
              const userName = userSnap.exists() ? userSnap.data().name || 'Anonymous' : 'Anonymous';
              return { userId, total, name: userName };
            })
        );

        console.log("🏆 Top Donors:", topDonors);

        setLeaderboard(topDonors);
      } catch (err) {
        console.error('❌ Failed to fetch donors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDonors();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: text }]}>{t('donors.topDonors')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#EFAC3A" />
        ) : leaderboard.length === 0 ? (
          <Text style={[styles.emptyText, { color: muted }]}>{t('donors.noDonorsYet')}</Text>
        ) : (
          leaderboard.map((donor, index) => (
            <View key={index} style={[styles.donorCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.rank, { color: '#EFAC3A' }]}>#{index + 1}</Text>
              <View style={styles.donorInfo}>
                <Text style={[styles.name, { color: text }]}>{donor.name}</Text>
                <Text style={[styles.amount, { color: muted }]}>CAD ${donor.total.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  donorInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
