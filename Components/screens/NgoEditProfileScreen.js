import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
};

const BACKEND_URL = 'https://kindkart-0l245p6y.b4a.run';

export default function NgoEditProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ngoName, setNgoName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState('');

  useEffect(() => {
    const fetchNgo = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const docSnap = await getDoc(doc(db, 'ngo', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNgoName(data.ngoName || '');
          setContact(data.contact || '');
          setEmail(data.email || '');
          setAvatarUri(data.avatarUrl || '');
        }
      } catch (err) {
        Alert.alert('Error', 'Could not fetch NGO info.');
      } finally {
        setLoading(false);
      }
    };
    fetchNgo();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission denied', 'Please allow access to photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uriToBlob = (uri) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

  const getPresignedUrls = async (filename, fileType, userId, itemId) => {
    const res = await fetch(`${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(filename)}&fileType=${encodeURIComponent(fileType)}&userId=${userId}&itemId=${itemId}&type=ngo`);
    if (!res.ok) throw new Error('Presigned URL fetch failed');
    return await res.json(); 
  };

  const uploadImageAsync = async (uri, userId) => {
    const blob = await uriToBlob(uri);
    const fileName = uri.split('/').pop().split('?')[0];
    const fileType = getMimeType(fileName);
    const itemId = Math.random().toString(36).substring(2, 10);
    const { uploadUrl, publicUrl } = await getPresignedUrls(fileName, fileType, userId, itemId);
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
      throw new Error(errorText);
    }
    if (blob.close) blob.close();
    return publicUrl;
  };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    if (!ngoName.trim() || !contact.trim()) {
      Alert.alert('Missing Info', 'NGO Name and Contact are required.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = avatarUri;
      if (avatarUri && !avatarUri.startsWith('http')) {
        avatarUrl = await uploadImageAsync(avatarUri, uid);
      }

      const updateData = {
        ngoName: ngoName.trim(),
        contact: contact.trim(),
      };
      
      if (avatarUrl !== undefined) {
        updateData.avatarUrl = avatarUrl;
      }
      
      await updateDoc(doc(db, 'ngo', uid), updateData);
      
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0AB1E7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton} >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>


      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={pickImage} style={styles.logoWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.logo} />
        ) : (
          <View style={styles.initialsAvatar}>
            <Text style={styles.initialsText}>
              {ngoName
                ? ngoName
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                : 'NGO'}
            </Text>
          </View>
        )}


          <View style={styles.editIcon}>
            <Icon name="camera-plus" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>NGO Name</Text>
        <TextInput
          style={styles.input}
          value={ngoName}
          onChangeText={setNgoName}
          placeholder="NGO Name"
        />

        <Text style={styles.label}>Contact</Text>
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email (not editable)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#eee' }]}
          value={email}
          editable={false}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginTop: 6,
  },
  logoWrap: { alignItems: 'center', marginVertical: 24 },
  logo: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 120 / 3,
    backgroundColor: '#0AB1E7',
    borderRadius: 18,
    padding: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 20,
  },
  backText: {
    color: '#EFAC3A',
    fontWeight: '600',
    fontSize: 16,
  },
  
  saveBtn: {
    marginTop: 30,
    backgroundColor: '#F6B93B',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  initialsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#B8D6DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2E41',
  },
  
});
