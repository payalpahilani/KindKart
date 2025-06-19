import React from 'react';
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
import { useCallback, useState } from 'react';


export default function NgoDashboardScreen() {

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

      
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.heading}>Dashboard Overview</Text>

        {/* Campaign Stats */}
        <View style={styles.cardRow}>
        <View style={styles.statCard}>
            {/* <Image
              source={require('../../assets/Images/active_campaign.png')}
              style={styles.iconImage}
            /> */}
        <Text style={styles.statNumber}>{activeCount}</Text>
        <Text style={styles.statLabel}>Active Campaigns</Text>
        </View>

          <View style={styles.statCard}>
            {/* <Image
              source={require('../../assets/Images/closed_campaign.png')}
              style={styles.iconImage}
            /> */}
            <Text style={styles.statNumber}>{closedCount}</Text>
            <Text style={styles.statLabel}>Closed Campaigns</Text>
          </View>
        </View>

        {/* Daily Donations Bar Chart */}
        <Text style={styles.sectionTitle}>Daily Donations</Text>
        <Image
          source={require('../../assets/Images/bar_chart.png')}
          style={styles.chartImage}
        />

        {/* Donation Trends Line Chart */}
        <Text style={styles.sectionTitle}>Donations Overview</Text>
        <Image
          source={require('../../assets/Images/line_chart.png')}
          style={styles.chartImage}
        />

        {/* Top Donor */}
        <Text style={styles.sectionTitle}>Top Donor Today</Text>
        <View style={styles.donorCard}>
          {/* <Image
            source={require('../../assets/Images/top_donor.png')}
            style={styles.donorImage}
          /> */}
          <Text style={styles.donorName}>Sarah Johnson</Text>
          <Text style={styles.donorAmount}>CAD $150</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2E41',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#F5F5F5',
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
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 16,
    color: '#1F2E41',
  },
  chartImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 24,
  },
  donorCard: {
    backgroundColor: '#B8D6DF',
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
    color: '#1F2E41',
  },
  donorAmount: {
    fontSize: 14,
    color: '#1F2E41',
    marginTop: 4,
  },
});
