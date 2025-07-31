import React, { useCallback, useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../Utilities/ThemeContext';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Math.round(Dimensions.get('window').width || 360);

export default function NgoDashboardScreen() {
  const theme = useContext(ThemeContext);
  const isDarkMode = theme?.isDarkMode ?? false;

  const [activeCount, setActiveCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [dailyData, setDailyData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [overviewData, setOverviewData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        color: (opacity = 1) => '#CCC',  // default stub
        strokeWidth: 2,
        title: 'N/A',
      },
    ],
  });

  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
          // Fetch campaigns
          const campQ = query(
            collection(db, 'campaigns'),
            where('createdBy', '==', userId)
          );
          const campSnap = await getDocs(campQ);

          let active = 0;
          let closed = 0;
          const campaignIds = [];
          const campaignNames = {};

          campSnap.forEach((doc) => {
            const d = doc.data();
            if (d.status === 'closed') closed += 1;
            else active += 1;
            campaignIds.push(doc.id);
            campaignNames[doc.id] = d.title || `Campaign ${doc.id.slice(-4)}`;
          });

          setActiveCount(active);
          setClosedCount(closed);

          // Fetch donations
          const donQ = query(collection(db, 'donations'));
          const donSnap = await getDocs(donQ);
          const donations = [];

          donSnap.forEach((doc) => {
            const d = doc.data();
            if (
              campaignIds.includes(d.campaignId) &&
              !isNaN(parseFloat(d.amount))
            ) {
              donations.push({
                amount: parseFloat(d.amount),
                timestamp: d.timestamp?.toDate(),
                campaignId: d.campaignId,
              });
            }
          });

          // Prepare last 7 days array
          const today = new Date();
          const days = [...Array(7)].map((_, i) => {
            const dt = new Date();
            dt.setDate(today.getDate() - (6 - i));
            return dt;
          });

          // Daily totals
          const dayLabels = days.map((d) =>
            d.toLocaleDateString('en-US', { weekday: 'short' })
          );
          const daySums = new Array(7).fill(0);
          donations.forEach((don) => {
            if (!don.timestamp) return;
            days.forEach((day, i) => {
              if (don.timestamp.toDateString() === day.toDateString()) {
                daySums[i] += don.amount;
              }
            });
          });
          setDailyData({
            labels: dayLabels,
            datasets: [{ data: daySums }],
          });

          // Multi-line overview
          const campaignDonationMap = {};
          campaignIds.forEach((id) => {
            campaignDonationMap[id] = new Array(7).fill(0);
          });
          donations.forEach((don) => {
            if (!don.timestamp) return;
            days.forEach((day, i) => {
              if (don.timestamp.toDateString() === day.toDateString()) {
                campaignDonationMap[don.campaignId][i] += don.amount;
              }
            });
          });

          const campaignColors = [
            '#FF6633',
            '#0AB1E7',
            '#00537A',
            '#993333',
            '#B8D6DF',
            '#F3E8DD',
            '#888888',
          ];

          const datasets = Object.entries(campaignDonationMap).map(
            ([campaignId, data], idx) => ({
              data,
              color: (opacity = 1) =>
                campaignColors[idx % campaignColors.length],
              strokeWidth: 2,
              title: campaignNames[campaignId],
            })
          );

          setOverviewData({
            labels: days.map((d) => `${d.getMonth() + 1}/${d.getDate()}`),
            datasets,
          });
        } catch (err) {
          console.error('Dashboard fetch failed:', err);
        }
      };

      fetchDashboardData();
    }, [])
  );

  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? '#1F1F1F' : '#FFFFFF',
    backgroundGradientTo: isDarkMode ? '#1F1F1F' : '#FFFFFF',
    color: (opacity = 1) =>
      isDarkMode
        ? `rgba(255,255,255,${opacity})`
        : `rgba(0,0,0,${opacity})`,
    labelColor: (opacity = 1) =>
      isDarkMode
        ? `rgba(255,255,255,${opacity})`
        : `rgba(0,0,0,${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: isDarkMode ? '#FF6633' : '#993333',
    },
    decimalPlaces: 0,
  };

  const bg = isDarkMode ? '#121212' : '#FFFFFF';
  const cardBg = isDarkMode ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDarkMode ? '#E1E1E1' : '#1F2E41';
  const subTextColor = isDarkMode ? '#A0A0A0' : '#666666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.heading, { color: textColor }]}>
          Dashboard Overview
        </Text>

        {/* Stats */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {activeCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              Active Campaigns
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {closedCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              Closed Campaigns
            </Text>
          </View>
        </View>

        {/* Daily Bar Chart */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Daily Donations
        </Text>
        <View style={styles.chartWrapper}>
        <BarChart
          data={dailyData}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          style={[styles.chart, { marginLeft: -PADDING }]}
          fromZero
          showBarTops
          withInnerLines={false}
        />
        </View>

        {/* Multi-line Overview */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Donations Overview
        </Text>
        {overviewData.datasets.length > 0 ? (
          <LineChart
            data={overviewData}
            width={CHART_WIDTH}
            height={260}
            chartConfig={chartConfig}
            style={[styles.chart,]}
            fromZero
            bezier
            verticalLabelRotation={30}
            withShadow={false}
            withDots
          />
        ) : (
          <Text style={{ color: subTextColor }}>
            No donation overview data available.
          </Text>
        )}

        {/* Legend */}
        <View style={{ marginTop: 10 }}>
          {overviewData.datasets.map((ds, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  marginRight: 4,
                  backgroundColor:
                    typeof ds.color === 'function' ? ds.color(1) : '#CCCCCC',
                }}
              />
              <Text style={{ color: textColor, fontSize: 12 }}>
                {String(ds.title)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const PADDING = 20;
const CHART_WIDTH = screenWidth - PADDING * 2;
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: PADDING,
    paddingBottom: 40,
  },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartWrapper: {
    alignSelf: 'center',         
    marginTop: 8,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 12 },
  chart: { borderRadius: 12},
});
