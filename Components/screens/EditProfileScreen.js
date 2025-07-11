import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../Utilities/ThemeContext';

const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";

const getMimeType = (uri) => {
  const ext = uri.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
};

const generateItemId = () => {
  return Math.random().toString(36).substring(2, 12);
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setAvatarUri(data.avatarUrl || '');
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Convert URI to Blob (for upload)
  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  // Get presigned upload URL from backend
  const getPresignedUrl = async (fileName, fileType, userId, itemId) => {
    const url = `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}&userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(itemId)}&type=profile`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to get presigned URL');
    return await res.json(); // expects { uploadUrl, publicUrl }
  };

  // Upload image to S3 using presigned URL
  const uploadImageToS3 = async (uri, userId) => {
    const blob = await uriToBlob(uri);
    const fileName = uri.split('/').pop();
    const fileType = getMimeType(uri);
    const itemId = generateItemId();

    const { uploadUrl, publicUrl } = await getPresignedUrl(fileName, fileType, userId, itemId);

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
      console.error('S3 upload error:', errorText);
      throw new Error('Failed to upload image to S3');
    }

    if (blob.close) blob.close();

    return publicUrl; // return permanent public URL (not presigned)
  };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      Alert.alert('Invalid Input', 'Name and phone number cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      let avatarUrlToSave = avatarUri;

      // If user picked a new image and it's not a remote URL, upload it
      if (avatarUri && !avatarUri.startsWith('http')) {
        avatarUrlToSave = await uploadImageToS3(avatarUri, uid);
      }

      await updateDoc(doc(db, 'users', uid), {
        name: trimmedName,
        phone: trimmedPhone,
        avatarUrl: avatarUrlToSave,
      });

      Alert.alert('Success', 'Profile updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Upload failed', error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F6B93B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={styles.safe.backgroundColor} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color={styles.backIcon.color} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
            <Image
              source={avatarUri ? { uri: avatarUri } : require('../../assets/Images/avatar.jpg')}
              style={styles.avatar}
            />
            <View style={styles.editIcon}>
              <Icon name="camera-plus" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              editable={!saving}
              selectionColor={isDarkMode ? '#F6B93B' : '#222'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (not editable)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f1f1f1' }]}
              value={email}
              editable={false}
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              keyboardType="phone-pad"
              editable={!saving}
              selectionColor={isDarkMode ? '#F6B93B' : '#222'}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const base = {
  safe: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F6B93B',
    borderRadius: 18,
    padding: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F6B93B',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121212',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E3E6',
  },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#fff' },
  backBtn: { ...base.backBtn, backgroundColor: '#F2F2F7' },
  backIcon: { color: '#000' },
  avatar: { ...base.avatar, backgroundColor: '#eee' },
  label: { ...base.label, color: '#444' },
  input: {
    ...base.input,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    color: '#222',
  },
  card: {
    ...base.card,
    backgroundColor: '#fff',
  },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#121212' },
  backBtn: { ...base.backBtn, backgroundColor: '#1E1E1E' },
  backIcon: { color: '#fff' },
  avatar: { ...base.avatar, backgroundColor: '#333' },
  label: { ...base.label, color: '#ccc' },
  input: {
    ...base.input,
    borderColor: '#555',
    backgroundColor: '#2a2a2a',
    color: '#eee',
  },
  card: {
    ...base.card,
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
  },
});
