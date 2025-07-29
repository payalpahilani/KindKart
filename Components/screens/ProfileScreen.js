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

/* ──────────────────  BADGE META  ────────────────── */
const badgeDisplayMap = {
  firstDonation:   { label: "First Donation",   image: require('../../assets/first-donation.png'),    icon: "hand-extended-outline",  color: "#97D2FB"  },
  kindSoul:        { label: "Kind Soul",        image: require('../../assets/kind-soul.png'),         icon: "hand-heart",             color: "#B8D6DF" },
  firstListing:    { label: "First Listing",    image: require('../../assets/first-listing.png'),     icon: "format-list-bulleted",   color: "#4C9F70"  },
  communitySeller: { label: "Community Seller", image: require('../../assets/community-seller.png'),  icon: "account-group" ,         color: "#993333"},
  generousHeart:   { label: "Generous Heart",   image: require('../../assets/generous-heart.png'),    icon: "heart-multiple",         color: "#FF9AA2"},  
  profilePro:      { label: "Profile Pro",      image: require('../../assets/profile-pro.png'),       icon: "account-star",           color: "#A8D1DF" },
  helperBee:       { label: "Helper Bee",       image: require('../../assets/helper-bee.png'),        icon: "share-variant",          color: "#ECCBD9" },
};

const badgeSpec = {
  firstDonation:   { field: "donationCount",   need: 1,   desc: "Make your very first donation" },
  kindSoul:        { field: "donationCount",   need: 5,   desc: "Donate 5 times" },
  generousHeart:   { field: "totalDonated",    need: 100, desc: "Give more than 100 in total" },
  firstListing:    { field: "listingCount",    need: 1,   desc: "Post your first listing" },
  communitySeller: { field: "listingCount",    need: 10,  desc: "Reach 10 listings" },
  helperBee:       { field: "sharedCount",     need: 3,   desc: "Share KindKart three times" },
  profilePro:      { field: "profileCompleted",need: true,
                     desc: "Complete your profile (name, phone, avatar & verified e‑mail)" },
};
/* ──────────────────────────────────────────────── */

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [user, setUser]               = useState(null);
  const [showAllBadges, setShowAll]   = useState(false);
  const [infoOpen, setInfoOpen]       = useState(false);
  const [focusKey, setFocusKey]       = useState(null);

  /* ---------- pull user ---------- */
  const readProfile = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setUser(snap.data());
    } catch (e) { console.warn("read profile error:", e); }
    finally      { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { readProfile(); }, []);

  /* ---------- sync email‑verified flag ---------- */
  useEffect(() => {
    const sync = async () => {
      const cur = auth.currentUser;
      if (!cur) return;
      await cur.reload();
      if (cur.emailVerified && user && !user.emailVerified) {
        await updateDoc(doc(db, "users", cur.uid), { emailVerified: true });
        setUser((u) => ({ ...u, emailVerified: true }));
      }
    };
    sync();
  }, [user]);

  /* ---------- pull‑to‑refresh ---------- */
  const onRefresh = useCallback(() => { setRefreshing(true); readProfile(); }, []);

  /* ---------- sign‑out / misc nav ---------- */
  const handleRowPress = (action) => {
    switch (action) {
      case "settings":   navigation.navigate("SettingsScreen"); break;
      case "faq":        navigation.navigate("FAQ");      break;
      case "likedAds":   navigation.navigate("LikedAdsScreen"); break;
      case "yourAds":    navigation.navigate("YourAdsScreen");  break;
      case "exit":
        signOut(auth)
          .then(() => navigation.reset({ index: 0, routes: [{ name: "Launch" }] }))
          .catch(() => Alert.alert("Error", "Failed to sign out."));
        break;
      default: break;
    }
  };

  const sendVerificationEmail = async () => {
    const cur = auth.currentUser;
    if (!cur) return Alert.alert("Not logged in");
    if (cur.emailVerified) return Alert.alert("Already verified");
    try {
      await sendEmailVerification(cur);
      Alert.alert("Verification email sent", "Check your inbox and spam folder.");
    } catch (err) { Alert.alert("Error", err.message); }
  };

  /* ---------- theme / style ---------- */
  const styles = isDarkMode ? darkStyles : lightStyles;
  const barStyle = isDarkMode ? "light-content" : "dark-content";
  const barBg    = isDarkMode ? "#121212" : "#fff";

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={barStyle} backgroundColor={barBg} />
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#F6B93B" />
      </SafeAreaView>
    );
  }
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={barStyle} backgroundColor={barBg} />
        <View style={[styles.safe,{justifyContent:"center",alignItems:"center"}]}>
          <Text style={styles.noUserText}>No user data found.</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={readProfile}>
            <Text style={{ color: "#fff" }}>Reload Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- main render ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={barStyle} backgroundColor={barBg} />

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
        {/* -------- header -------- */}
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => navigation.navigate("EditProfileScreen", { user })}
        >
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.initialAvatar}>
              <Text style={styles.initialText}>
                {(user.name || "U")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <View>
            <Text style={styles.name}>{user.name || "User"}</Text>
            {user.email && <Text style={styles.email}>{user.email}</Text>}

            {user.emailVerified ? (
              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedText}>Verified Account</Text>
                <Icon name="check-decagram" size={18} color="green" style={{ marginLeft: 6 }} />
              </View>
            ) : (
              <TouchableOpacity onPress={sendVerificationEmail} style={styles.verifiedRow}>
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

        {/* -------- badges -------- */}
        {user.badges && Object.keys(user.badges).length > 0 && (
          <View style={styles.badgeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.badgeHeading}>🏅 Your Badges</Text>
              <TouchableOpacity onPress={() => setShowAll(!showAllBadges)}>
                <Text style={styles.seeAll}>{showAllBadges ? "Show less" : "View all"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgesGrid}>
              {(showAllBadges
                ? Object.entries(badgeDisplayMap)
                : Object.entries(badgeDisplayMap).slice(0, 3)
              ).map(([key, badge]) => {
                const earned = user.badges?.[key] === true;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setFocusKey(key);
                      setInfoOpen(true);
                    }}
                    style={[
                      styles.badgeCard,
                      { backgroundColor: earned ?"transparent" : "#E0E0E0" },
                    ]}
                  >
                    {earned ? (
                    <Image
                      source={badge.image}
                      style={{ width: 90, height: 90, borderRadius: 5 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="lock" size={28} color="#999" />
                  )}
                    <Text style={[styles.badgeLabel, { color: earned ? "#333" : "#999" }]}>
                      {badge.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* -------- menu -------- */}
        {[
          { icon: "cog-outline", label: "Settings", action: "settings" },
          { icon: "heart-outline", label: "Your Liked Ads", action: "likedAds" },
          { icon: "format-list-bulleted", label: "Your Ads", action: "yourAds" },
          { icon: "comment-question-outline", label: "FAQ", action: "faq" },
          { icon: "exit-to-app", label: "Sign Out", action: "exit" },
        ].map((o) => {
          const isExit = o.action === "exit";
          return (
            <TouchableOpacity
              key={o.action}
              style={styles.optionCard}
              onPress={() => handleRowPress(o.action)}
            >
              <View style={styles.cardLeft}>
                <Icon
                  name={o.icon}
                  size={22}
                  color={isExit ? "red" : isDarkMode ? "#fff" : "#000"}
                />
                <Text style={[styles.optionText, isExit && { color: "red" }]}>{o.label}</Text>
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

      {/* -------- info modal -------- */}
      {infoOpen && focusKey && (() => {
        const spec = badgeSpec[focusKey];
        const curr = user[spec.field] ?? 0;
        const need = spec.need;
        const done = need === true ? curr === true : curr >= need;
        const progress =
          need === true ? (done ? "Completed" : "Not completed") : `${Math.min(curr, need)} / ${need}`;
        return (
          <View style={styles.infoOverlay}>
            <View style={styles.infoBox}>
              <Icon
                name={badgeDisplayMap[focusKey].icon}
                size={40}
                color={badgeDisplayMap[focusKey].color}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.infoTitle}>{badgeDisplayMap[focusKey].label}</Text>
              <Text style={styles.infoDesc}>{spec.desc}</Text>
              <Text style={styles.infoProgress}>{progress}</Text>
              <TouchableOpacity style={styles.infoBtn} onPress={() => setInfoOpen(false)}>
                <Text style={styles.infoBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </SafeAreaView>
  );
}

/* ────────────────── styles ───────────────── */

const base = {
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginRight: 18 },
  cardLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
};

const sharedBadge = {
  badgeSection: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeHeading: { fontSize: 16, fontWeight: "bold" },
  seeAll: { fontSize: 13, color: "#4A90E2", fontWeight: "600" },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 10,
    gap: 25,
  },
  badgeCard: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeLabel: { fontSize: 10, marginTop: 6, textAlign: "center", fontWeight: "600" },
};

/* light */
const lightStyles = StyleSheet.create({
  ...base,
  ...sharedBadge,
  safe: { ...base.safe, backgroundColor: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#000" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  verifiedRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  verifiedText: { fontSize: 14, color: "#666" },
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

  /* modal */
  infoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  infoBox: { width: 300, padding: 24, borderRadius: 20, backgroundColor: "#fff", alignItems: "center" },
  infoTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4, color: "#000" },
  infoDesc: { fontSize: 14, textAlign: "center", marginBottom: 12, color: "#333" },
  infoProgress: { fontSize: 16, fontWeight: "600", marginBottom: 18, color: "#4A90E2" },
  infoBtn: {
    backgroundColor: "#F6B93B",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  infoBtnText: { color: "#121212", fontWeight: "700" },
});

/* dark */
const darkStyles = StyleSheet.create({
  ...base,
  ...sharedBadge,
  safe: { ...base.safe, backgroundColor: "#121212" },
  name: { fontSize: 22, fontWeight: "700", color: "#fff" },
  email: { fontSize: 14, color: "#bbb", marginTop: 4 },
  verifiedRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  verifiedText: { fontSize: 14, color: "#bbb" },
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

  /* modal */
  infoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  infoBox: { width: 300, padding: 24, borderRadius: 20, backgroundColor: "#1E1E1E", alignItems: "center" },
  infoTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4, color: "#fff" },
  infoDesc: { fontSize: 14, textAlign: "center", marginBottom: 12, color: "#ccc" },
  infoProgress: { fontSize: 16, fontWeight: "600", marginBottom: 18, color: "#F6B93B" },
  infoBtn: {
    backgroundColor: "#F6B93B",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  infoBtnText: { color: "#121212", fontWeight: "700" },
});
