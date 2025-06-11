import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const initial = params?.user || {};

  const [name, setName] = useState(initial.name || '');
  const [avatarUri, setAvatarUri] = useState(initial.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  // Pick Image from library with permissions
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to change your avatar.');
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

  // Upload image using fetch to get blob, then uploadBytesResumable
  const uploadImageAsync = async (uri, uid) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error('Failed to fetch image for upload.');
      const blob = await response.blob();

      const path = `avatars/${uid}/${Date.now()}.jpg`;
      const storRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.log('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(storRef);
              resolve(downloadURL);
            } catch (error) {
              console.log('Get download URL error:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.log('Upload image async error:', error);
      throw error;
    }
  };

  // Save profile data including avatar upload if changed
  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Invalid', 'Display name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrlToSave = avatarUri;

      // Upload new local avatar image if uri is local file (not remote URL)
      if (avatarUri && !avatarUri.startsWith('https://')) {
        avatarUrlToSave = await uploadImageAsync(avatarUri, uid);
      }

      await updateDoc(doc(db, 'users', uid), {
        name: name.trim(),
        avatarUrl: avatarUrlToSave,
      });

      Alert.alert('Success', 'Profile updated.');
      navigation.goBack();
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Upload failed', error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.container}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.8}>
          <Image
            source={
              avatarUri ? { uri: avatarUri } : require('../../assets/Images/avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.editIcon}>
            <Icon name="camera-plus" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          editable={!saving}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  avatarWrap: {
    marginTop: 60,
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
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 32,
  },
  saveBtn: {
    backgroundColor: '#F6B93B',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
