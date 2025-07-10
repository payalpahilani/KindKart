import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image, Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';



export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

 useFocusEffect(
  useCallback(() => {
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
  }, [])
);


  const renderItem = ({ item }) => (
    <View style={styles.card}>
    <Image
      source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }}
      style={styles.image}
    />
    <View style={styles.info}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.amount}>🎯 Goal: {item.currency} {item.totalDonation?.toLocaleString()}</Text>
      <Text numberOfLines={3} style={styles.story}>{item.story}</Text>
  
      <View style={styles.actions}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate('NgoEditCampaign', { campaign: item })}
      >
        <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: '#D94141' }]}
        onPress={() => handleDelete(item.id)}
      >
        <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
      </TouchableOpacity>
    </View>

    </View>
  </View>
  
  );
  
  
  const handleDelete = (campaignId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'campaigns', campaignId));
              setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
              Alert.alert('Deleted', 'Campaign has been deleted.');
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Could not delete campaign.');
            }
          },
        },
      ]
    );
  };
  


  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007B55" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Your Active Campaigns</Text>
        {campaigns.length === 0 && (
          <Text style={styles.subtitle}>No campaigns created yet.</Text>
        )}
      </View>

      {campaigns.length > 0 && (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NgoCreateCampaign')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007B55',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginVertical: 10,     // ✅ top & bottom spacing only
    marginLeft: 10,   
    alignSelf: 'center', 
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    color: '#007B55',
    marginBottom: 6,
  },
  story: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end'
  },
  editButton: {
    backgroundColor: '#0AB1E7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: '#D94141',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  iconButton: {
    backgroundColor: '#0AB1E7',
    width: 26,
    height: 26,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  
});
