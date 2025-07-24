import React, { useState, useEffect, useContext } from "react";
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
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";
import { checkAndAwardBadges } from "../Utilities/firebaseHelpers";   // ← NEW
const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";

/* ---------- helpers for S3 ---------- */
const getMimeType = (uri) => {
  const ext = uri.split(".").pop().toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
};
const generateItemId = () => Math.random().toString(36).substring(2, 12);
const uriToBlob = (uri) =>
  new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => res(xhr.response);
    xhr.onerror = () => rej(new Error("Failed to convert URI to Blob"));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
const getPresignedUrl = async (fileName, fileType, userId, itemId) => {
  const url = `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
    fileName
  )}&fileType=${encodeURIComponent(fileType)}&userId=${encodeURIComponent(
    userId
  )}&itemId=${encodeURIComponent(itemId)}&type=profile`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get presigned URL");
  return res.json(); // { uploadUrl, publicUrl }
};
/* ------------------------------------ */

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  /* ---------- local state ---------- */
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  /* badge‑popup */
  const [showBadge, setShowBadge]       = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  /* --------------------------------- */

  /* ---------- fetch user data ---------- */
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || "");
          setEmail(d.email || "");
          setPhone(d.phone || "");
          setAvatarUri(d.avatarUrl || "");
        }
      } catch (err) {
        console.log("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  /* ------------------------------------ */

  /* ---------- image picker ---------- */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert(
        "Permission needed",
        "Please allow photo access to change your avatar."
      );

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
  };
  /* ---------------------------------- */

  /* ---------- save handler ---------- */
  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Error", "User not authenticated.");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone)
      return Alert.alert("Invalid Input", "Name and phone number cannot be empty.");

    setSaving(true);
    try {
      /* upload avatar if new local image */
      let avatarUrlToSave = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http"))
        avatarUrlToSave = await uploadImageToS3(avatarUri, uid);

      /* determine completion */
      const profileCompleted =
        trimmedName.length > 0 &&
        trimmedPhone.length > 0 &&
        avatarUrlToSave.startsWith("http");

      /* push to Firestore */
      await updateDoc(doc(db, "users", uid), {
        name: trimmedName,
        phone: trimmedPhone,
        avatarUrl: avatarUrlToSave,
        profileCompleted,
      });

      /* check badges */
      const unlocked = await checkAndAwardBadges(uid);
      if (unlocked.includes("profilePro")) {
        setUnlockedBadge("Profile Pro ⭐️");
        setShowBadge(true);
        return; // stop; wait for user to close modal
      }

      Alert.alert("Success", "Profile updated.");
      navigation.goBack();
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Upload failed", err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };
  /* ---------------------------------- */

  /* ---------- upload helper ---------- */
  const uploadImageToS3 = async (uri, uid) => {
    const blob = await uriToBlob(uri);
    const fileName = uri.split("/").pop();
    const fileType = getMimeType(uri);
    const { uploadUrl, publicUrl } = await getPresignedUrl(
      fileName,
      fileType,
      uid,
      generateItemId()
    );
    const upRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": fileType, "x-amz-server-side-encryption": "AES256" },
    });
    if (!upRes.ok) throw new Error("Failed to upload image to S3");
    blob.close?.();
    return publicUrl;
  };
  /* ---------------------------------- */

  if (loading)
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F6B93B" />
      </SafeAreaView>
    );

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={styles.safe.backgroundColor}
        />

        {/* back btn */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={styles.backIcon.color} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* card */}
          <View style={styles.card}>
            {/* avatar */}
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
              {avatarUri.startsWith("http") ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.initialAvatar}>
                  <Text style={styles.initialText}>
                    {(name || "U")
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

            {/* name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
                editable={!saving}
                selectionColor={isDarkMode ? "#F6B93B" : "#222"}
              />
            </View>

            {/* email */}
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

            {/* phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Your phone number"
                placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
                keyboardType="phone-pad"
                editable={!saving}
                selectionColor={isDarkMode ? "#F6B93B" : "#222"}
              />
            </View>

            {/* save btn */}
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

      {/* ---------- badge modal ---------- */}
      {showBadge && (
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModal}>
            <Text style={styles.badgeTitle}>🎉 Badge Unlocked!</Text>
            <Text style={styles.badgeName}>{unlockedBadge}</Text>
            <TouchableOpacity
              onPress={() => {
                setShowBadge(false);
                navigation.goBack();
              }}
              style={styles.badgeButton}
            >
              <Text style={styles.badgeButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

/* ---------- styles (light & dark) ---------- */
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
