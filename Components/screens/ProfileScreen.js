import React, { useEffect, useState, useCallback, useContext } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { ThemeContext } from "../Utilities/ThemeContext";
import { sendEmailVerification } from "firebase/auth";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Read user profile from Firestore
  const readProfile = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) setUser(userSnap.data());
    } catch (e) {
      console.warn("Error reading profile:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sync Firestore emailVerified with Firebase Auth emailVerified
  useEffect(() => {
    const syncEmailVerification = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        // Force reload to update the latest user info from Firebase Authentication
        await currentUser.reload();

        // Now check updated status
        if (currentUser.emailVerified && user && !user.emailVerified) {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, { emailVerified: true });
          setUser((prevUser) => ({ ...prevUser, emailVerified: true }));
        }
      } catch (error) {
        console.warn("Failed to update emailVerified:", error);
      }
    };
    syncEmailVerification();
  }, [user]);

  useEffect(() => {
    readProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    readProfile();
  }, []);

  const handleRowPress = (action) => {
    switch (action) {
      case "settings":
        navigation.navigate("SettingsScreen");
        break;
      case "faq":
        navigation.navigate("FAQScreen");
        break;
      case "exit":
        signOut(auth)
          .then(() =>
            navigation.reset({ index: 0, routes: [{ name: "Launch" }] })
          )
          .catch(() => Alert.alert("Error", "Failed to sign out."));
        break;
      case "likedAds":
        navigation.navigate("LikedAdsScreen");
        break;
      case "yourAds":
        navigation.navigate("YourAdsScreen");
        break;
      default:
        break;
    }
  };

  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert(
        "Not logged in",
        "You must be logged in to verify your email."
      );
      return;
    }
    if (currentUser.emailVerified) {
      Alert.alert("Already verified", "Your email is already verified.");
      return;
    }

    try {
      await sendEmailVerification(currentUser);
      Alert.alert(
        "Verification email sent",
        "Please check your inbox and spam folder."
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const styles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? "light-content" : "dark-content";
  const statusBarBg = isDarkMode ? "#121212" : "#fff";

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#F6B93B" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
        <View
          style={[
            styles.safe,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.noUserText}>No user data found.</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={readProfile}>
            <Text style={{ color: "#fff" }}>Reload Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? "#fff" : "#000"}
          />
        }
      >
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => navigation.navigate("EditProfileScreen", { user })}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.initialAvatar}>
              <Text style={styles.initialText}>
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </Text>
            </View>
          )}

          <View>
            <Text style={styles.name}>{user?.name || "User"}</Text>
            {user?.email && <Text style={styles.email}>{user.email}</Text>}

            {user?.emailVerified ? (
              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedText}>Verified Account</Text>
                <Icon
                  name="check-decagram"
                  size={18}
                  color="green"
                  style={{ marginLeft: 6 }}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={sendVerificationEmail}
                style={[styles.verifiedRow]}
              >
                <Text style={[styles.verifiedText, { color: "#F6B93B" }]}>
                  Verify your email
                </Text>
                <Icon
                  name="email-check-outline"
                  size={18}
                  color="#F6B93B"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {[
          { icon: "cog-outline", label: "Settings", action: "settings" },
          {
            icon: "heart-outline",
            label: "Your Liked Ads",
            action: "likedAds",
          },
          {
            icon: "format-list-bulleted",
            label: "Your Ads",
            action: "yourAds",
          },
          { icon: "comment-question-outline", label: "FAQ", action: "faq" },
          { icon: "exit-to-app", label: "Sign Out", action: "exit" },
        ].map((o) => {
          const isExit = o.action === "exit";
          return (
            <TouchableOpacity
              style={styles.optionCard}
              key={o.action}
              onPress={() => handleRowPress(o.action)}
            >
              <View style={styles.cardLeft}>
                <Icon
                  name={o.icon}
                  size={22}
                  color={isExit ? "red" : isDarkMode ? "#fff" : "#000"}
                />
                <Text style={[styles.optionText, isExit && { color: "red" }]}>
                  {o.label}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={isExit ? "red" : isDarkMode ? "#ccc" : "#888"}
              />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const base = {
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, marginRight: 18 },
  cardLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  newTag: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#000" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  verifiedRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  verifiedText: { fontSize: 14, color: "#666" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 22,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#000" },
  cardSubtitle: { fontSize: 13, color: "#555", marginTop: 4 },
  newTag: { ...base.newTag, backgroundColor: "#E0F7FA" },
  newTagText: { fontSize: 12, color: "#00BCD4", fontWeight: "700" },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontSize: 16, marginLeft: 16, color: "#000" },
  reloadButton: {
    marginTop: 12,
    backgroundColor: "#F6B93B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  noUserText: { fontSize: 16, color: "#444" },
  initialAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F6B93B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  initialText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: "#121212" },
  name: { fontSize: 22, fontWeight: "700", color: "#fff" },
  email: { fontSize: 14, color: "#bbb", marginTop: 4 },
  verifiedRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  verifiedText: { fontSize: 14, color: "#bbb" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 22,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  cardSubtitle: { fontSize: 13, color: "#aaa", marginTop: 4 },
  newTag: { ...base.newTag, backgroundColor: "#004D40" },
  newTagText: { fontSize: 12, color: "#00BCD4", fontWeight: "700" },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionText: { fontSize: 16, marginLeft: 16, color: "#fff" },
  reloadButton: {
    marginTop: 12,
    backgroundColor: "#F6B93B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  noUserText: { fontSize: 16, color: "#ccc" },
  initialAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F6B93B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  initialText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
});
