import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { ThemeContext } from '../Utilities/ThemeContext';

export default function NgoProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ngo, setNgo] = useState(null);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [campaignStats, setCampaignStats] = useState({ count: 0, total: 0 });

  const fetchNgoDetails = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const ngoDoc = await getDoc(doc(db, 'ngo', uid));
      if (ngoDoc.exists()) {
        setNgo(ngoDoc.data());
        fetchCampaignStats(uid);
      }
    } catch (err) {
      console.log('Error fetching NGO data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCampaignStats = async (uid) => {
    try {
      const q = query(collection(db, 'campaigns'), where('createdBy', '==', uid));
      const querySnapshot = await getDocs(q);
      let total = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.totalDonation) total += parseFloat(data.totalDonation);
      });
      setCampaignStats({ count: querySnapshot.size, total });
    } catch (err) {
      console.log('Error fetching campaign stats:', err);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => navigation.reset({ index: 0, routes: [{ name: 'Launch' }] }))
      .catch(() => Alert.alert('Error', 'Failed to sign out.'));
  };

  useEffect(() => {
    fetchNgoDetails();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#EFAC3A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNgoDetails} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image
              source={ngo?.avatarUrl ? { uri: ngo.avatarUrl } : require('../../assets/Images/avatar.jpg')}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{ngo?.ngoName || 'NGO Name'}</Text>
          <Text style={styles.email}>{ngo?.email}</Text>
        </View>

        {/* Info Section */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.card}>
          <InfoRow icon="phone" label="Contact" value={ngo?.contact} />
          <InfoRow icon="identifier" label="NGO Code" value={ngo?.ngoCode} />
          <InfoRow icon="email" label="Email" value={ngo?.email} />
        </View>

        {/* Campaign Statistics */}
        <Text style={styles.sectionTitle}>Campaign Overview</Text>
        <View style={[styles.card, styles.statsCard]}>
          <InfoRow icon="bullhorn" label="Active Campaigns" value={campaignStats.count} />
          <InfoRow icon="currency-usd" label="Total Raised" value={`$${campaignStats.total}`} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.prefRow}>
          <View style={styles.prefLabel}>
            <Icon name="bell-ring" size={22} color="#EFAC3A" />
            <Text style={styles.prefText}>Campaign Alerts</Text>
          </View>
          <Switch
            value={campaignAlerts}
            onValueChange={setCampaignAlerts}
            thumbColor={campaignAlerts ? '#fff' : '#ccc'}
            trackColor={{ true: '#EFAC3A', false: '#ccc' }}
          />
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('NgoEditProfile')}>
          <Icon name="account-edit" size={20} color="#333" />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('AboutUsScreen')}>
          <Icon name="information-outline" size={20} color="#333" />
          <Text style={styles.optionText}>About Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Icon name="exit-to-app" size={20} color="#e74c3c" />
          <Text style={[styles.optionText, { color: '#e74c3c' }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Row Component
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color="#888" style={{ width: 24 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: '#EFAC3A',
    borderRadius: 44,
    padding: 2,
    marginBottom: 10,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  name: { fontSize: 22, fontWeight: '700', color: '#4D4D4D' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 10,
    color: '#444',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    borderColor: '#eee',
    borderWidth: 1,
  },

  statsCard: { backgroundColor: '#F3E8DD' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderColor: '#eee',
    borderWidth: 1,
  },
  prefLabel: { flexDirection: 'row', alignItems: 'center' },
  prefText: { fontSize: 16, marginLeft: 10, color: '#333' },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: { fontSize: 16, marginLeft: 12, color: '#333' },
});
