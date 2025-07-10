import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';

const MAX_IMAGES = 5;
const BACKEND_URL = 'https://kindkart-0l245p6y.b4a.run';

function getMimeType(uri) {
  const ext = uri.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
}

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

  const [images, setImages] = useState(campaign.imageUrls || []);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Max image limit reached.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission denied', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets || [];
      setImages([...images, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImageToS3 = async (img, userId, itemId) => {
    const fileName = img.fileName || img.uri.split('/').pop();
    const fileType = img.type?.startsWith('image/') ? img.type : getMimeType(img.uri);

    const res = await fetch(
      `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
        fileName
      )}&fileType=${encodeURIComponent(fileType)}&userId=${userId}&itemId=${itemId}&type=ngo`
    );

    if (!res.ok) throw new Error('Failed to get S3 URL');
    const { uploadUrl, publicUrl } = await res.json();

    const imgRes = await fetch(img.uri);
    const blob = await imgRes.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': fileType,
        'x-amz-server-side-encryption': 'AES256',
      },
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.log('S3 upload error response:', errorText);
      throw new Error('Failed to upload image to S3');
    }

    return publicUrl;
  };

  const uploadAllImages = async (userId, itemId) => {
    const uploadedUrls = [];
    for (const img of images) {
      if (typeof img === 'string' && img.startsWith('https://')) {
        uploadedUrls.push(img); // already uploaded
      } else {
        const url = await uploadImageToS3(img, userId, itemId);
        uploadedUrls.push(url);
      }
    }
    return uploadedUrls;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      const itemId = campaign.id;

      const imageUrls = await uploadAllImages(userId, itemId);

      const docRef = doc(db, 'campaigns', campaign.id);
      await updateDoc(docRef, {
        title,
        story,
        totalDonation: parseFloat(goal),
        currency,
        status,
        imageUrls,
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

        <Text style={styles.label}>Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {[...images, ...(images.length < MAX_IMAGES ? [{}] : [])].map((item, index) => {
            if (!item?.uri && !item?.startsWith?.('http')) {
              return (
                <TouchableOpacity key={index} style={styles.imageBox} onPress={pickImages}>
                  <Text style={{ fontSize: 30, color: '#999' }}>+</Text>
                </TouchableOpacity>
              );
            }
            const uri = item.uri || item;
            return (
              <View key={index} style={styles.imageBox}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

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
  imageBox: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#D94141',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
