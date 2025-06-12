import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NgoEditCampaign() {
  const navigation = useNavigation();
  const route = useRoute();
  const { campaign } = route.params;

  const [title, setTitle] = useState(campaign.title || '');
  const [story, setStory] = useState(campaign.story || '');
  const [goal, setGoal] = useState(String(campaign.totalDonation) || '');
  const [currency, setCurrency] = useState(campaign.currency || '');
  const [status, setStatus] = useState(campaign.status || 'active');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const docRef = doc(db, 'campaigns', campaign.id);
      await updateDoc(docRef, {
        title,
        story,
        totalDonation: parseFloat(goal),
        currency,
        status,
      });
      Alert.alert('Updated', 'Campaign updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Update failed:', err);
      Alert.alert('Error', 'Failed to update campaign');
    } finally {
      setUpdating(false);
    }
  };

  const toggleCampaignStatus = async () => {
    const newStatus = status === 'closed' ? 'active' : 'closed';
    Alert.alert(
      newStatus === 'closed' ? 'Close Campaign' : 'Reopen Campaign',
      `Are you sure you want to ${newStatus === 'closed' ? 'close' : 'reopen'} this campaign?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus === 'closed' ? 'Close' : 'Reopen',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'campaigns', campaign.id);
              await updateDoc(docRef, { status: newStatus });
              setStatus(newStatus);
              Alert.alert('Updated', `Campaign is now ${newStatus}`);
              navigation.goBack();
            } catch (err) {
              console.error('Status update failed:', err);
              Alert.alert('Error', 'Failed to update campaign status');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.heading}>Edit Campaign</Text>
        <Text style={styles.label}>Campaign Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} />
        <Text style={styles.label}>Story</Text>
        <TextInput value={story} onChangeText={setStory} multiline style={[styles.input, { height: 100 }]} />
        <Text style={styles.label}>Goal Amount</Text>
        <TextInput value={goal} onChangeText={setGoal} keyboardType="numeric" style={styles.input} />
        <Text style={styles.label}>Currency</Text>
        <TextInput value={currency} onChangeText={setCurrency} style={styles.input} />

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={updating}>
          <Text style={styles.saveText}>{updating ? 'Updating...' : 'Update Campaign'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={toggleCampaignStatus}>
          <Text style={styles.closeText}>{status === 'closed' ? 'Reopen Campaign' : 'Close Campaign'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#EFAC3A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  closeBtn: {
    backgroundColor: '#B8D6DF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: { color: '#000', fontWeight: '600', fontSize: 16 },
});
