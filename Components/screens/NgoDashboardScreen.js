import React, { useCallback, useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../Utilities/ThemeContext';

export default function NgoDashboardScreen() {
  const { isDarkMode } = useContext(ThemeContext);

  const [activeCount, setActiveCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
          const q = query(collection(db, 'campaigns'), where('createdBy', '==', userId));
          const snapshot = await getDocs(q);
          let active = 0;
          let closed = 0;

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'closed') closed++;
            else active++;
          });

          setActiveCount(active);
          setClosedCount(closed);
        } catch (err) {
          console.error('Failed to fetch campaign stats:', err);
        }
      };

      fetchCounts();
    }, [])
  );

  // Dark mode colors
  const bg = isDarkMode ? '#121212' : '#fff';
  const cardBg = isDarkMode ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDarkMode ? '#E1E1E1' : '#1F2E41';
  const subTextColor = isDarkMode ? '#A0A0A0' : '#666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={[styles.heading, { color: textColor }]}>Dashboard Overview</Text>

        {/* Campaign Stats */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            {/* <Image
              source={require('../../assets/Images/active_campaign.png')}
              style={styles.iconImage}
            /> */}
            <Text style={[styles.statNumber, { color: textColor }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Active Campaigns</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            {/* <Image
              source={require('../../assets/Images/closed_campaign.png')}
              style={styles.iconImage}
            /> */}
            <Text style={[styles.statNumber, { color: textColor }]}>{closedCount}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Closed Campaigns</Text>
          </View>
        </View>

        {/* Daily Donations Bar Chart */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Daily Donations</Text>
        <Image
          source={require('../../assets/Images/bar_chart.png')}
          style={styles.chartImage}
        />

        {/* Donation Trends Line Chart */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Donations Overview</Text>
        <Image
          source={require('../../assets/Images/line_chart.png')}
          style={styles.chartImage}
        />

        {/* Top Donor */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Top Donor Today</Text>
        <View style={[styles.donorCard, { backgroundColor: cardBg }]}>
          {/* <Image
            source={require('../../assets/Images/top_donor.png')}
            style={styles.donorImage}
          /> */}
          <Text style={[styles.donorName, { color: textColor }]}>Sarah Johnson</Text>
          <Text style={[styles.donorAmount, { color: subTextColor }]}>CAD $150</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  iconImage: {
    width: 32,
    height: 32,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 16,
  },
  chartImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 24,
  },
  donorCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  donorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  donorAmount: {
    fontSize: 14,
    marginTop: 4,
  },
});
