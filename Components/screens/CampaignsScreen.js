import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const userId = getAuth().currentUser?.uid;
        if (!userId) return;

        const q = query(collection(db, 'campaigns'), where('createdBy', '==', userId));
        const querySnapshot = await getDocs(q);
        const result = [];
        querySnapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() });
        });
        setCampaigns(result);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.amount}>
          Goal: {item.currency} {item.totalDonation?.toLocaleString()}
        </Text>
        <Text numberOfLines={2} style={styles.story}>
          {item.story}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007B55" />
      </View>
    );
  }

  if (campaigns.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your Campaigns</Text>
        <Text style={styles.subtitle}>No campaigns created yet.</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('NgoCreateCampaign')}
        >
          <Text style={styles.createBtnText}>+ Create Campaign</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  story: {
    fontSize: 13,
    color: '#555',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: '#007B55',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
