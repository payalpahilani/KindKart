import React, { useState, useEffect, useContext } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../Utilities/ThemeContext';

const BACKEND_URL = 'https://kindkart-0l245p6y.b4a.run';

const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    default: return 'image/png';
  }
};

const generateItemId = () => Math.random().toString(36).substring(2, 12);
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
  const res = await fetch(
    `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
      filename
    )}&fileType=${encodeURIComponent(fileType)}&userId=${userId}&itemId=${itemId}&type=ngo`
  );
  if (!res.ok) throw new Error('Presigned URL fetch failed');
  return await res.json(); // { uploadUrl, publicUrl }
};

const uploadImageAsync = async (uri, userId) => {
  const blob = await uriToBlob(uri);
  const fileName = uri.split('/').pop().split('?')[0];
  const fileType = getMimeType(fileName);
  const itemId = generateItemId();
  const { uploadUrl, publicUrl } = await getPresignedUrls(fileName, fileType, userId, itemId);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': fileType,
      'x-amz-server-side-encryption': 'AES256',
    },
  });
  if (!uploadRes.ok) throw new Error('Image upload failed');
  blob.close?.();
  return publicUrl;
};

export default function NgoEditProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

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
        const snap = await getDoc(doc(db, 'ngo', uid));
        if (snap.exists()) {
          const data = snap.data();
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
        avatarUrl,
      };

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
        <ActivityIndicator size="large" color="#F6B93B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={styles.safe.backgroundColor}
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color={styles.backIcon.color} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          {avatarUri.startsWith('http') ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.initialAvatar}>
              <Text style={styles.initialText}>
                {(ngoName || "N")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.editIcon}>
            <Icon name="camera-plus" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NGO Name</Text>
          <TextInput
            style={styles.input}
            value={ngoName}
            onChangeText={setNgoName}
            placeholder="NGO Name"
            placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact</Text>
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (not editable)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? "#2a2a2a" : "#f1f1f1" },
            ]}
            value={email}
            editable={false}
            placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
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
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  label: { fontSize: 14, fontWeight: '600', color: '#ddd', marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginTop: 6,
    color: '#eee',
    backgroundColor: '#222',
  },
  logoWrap: { alignItems: 'center', marginVertical: 24, position: 'relative' },
  logo: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 120 / 3,
    backgroundColor: '#EFAC3A',
    borderRadius: 18,
    padding: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backText: {
    color: '#EFAC3A',
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 30,
    backgroundColor: '#EFAC3A',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveText: { color: '#121212', fontSize: 16, fontWeight: '600' },
  initialsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EFAC3A',
  },
});
const base = {
  safe: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 0 },
  backBtn: {
    width: 40,
    height: 40,
    marginTop: 24,
    borderRadius: 20,
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrap: { alignSelf: "center", marginBottom: 32 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F6B93B",
    borderRadius: 18,
    padding: 6,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: "500" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#F6B93B",
  },
  saveText: { fontSize: 16, fontWeight: "600", color: "#121212" },
  scrollContent: { padding: 24, paddingTop: 80 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
  },

  /* badge modal (shared) */
  badgeModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  badgeModal: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: 280,
  },
  badgeTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10, color: "#F6B93B" },
  badgeName: { fontSize: 18, marginBottom: 20, color: "#222" },
  badgeButton: {
    backgroundColor: "#F6B93B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeButtonText: { color: "#fff", fontWeight: "bold" },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: "#fff" },
  backBtn: { ...base.backBtn, backgroundColor: "#fff" },
  backIcon: { color: "#000" },
  card: { ...base.card, backgroundColor: "#fff", borderColor: "#E3E3E6" },
  label: { ...base.label, color: "#444" },
  input: { ...base.input, borderColor: "#ccc", backgroundColor: "#fff", color: "#222" },
  initialAvatar: {
    width: 80,
    height: 80,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#999",
  },
  initialText: { fontSize: 36, fontWeight: "bold", color: "#fff" },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: "#121212" },
  backBtn: { ...base.backBtn, backgroundColor: "#1E1E1E" },
  backIcon: { color: "#fff" },
  card: { ...base.card, backgroundColor: "#1E1E1E", borderColor: "#333" },
  label: { ...base.label, color: "#ccc" },
  input: {
    ...base.input,
    borderColor: "#555",
    backgroundColor: "#2a2a2a",
    color: "#eee",
  },
  initialAvatar: {
    width: 80,
    height: 80,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  initialText: { fontSize: 36, fontWeight: "bold", color: "#fff" },
});
