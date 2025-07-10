import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { app } from "../../firebaseConfig";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";

const auth = getAuth(app);
const db = getFirestore(app);

export default function YourAdsScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's ads on focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchAds = async () => {
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (!user) {
            setAds([]);
            setLoading(false);
            return;
          }
          const q = query(
            collection(db, "items"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const userAds = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (isActive) setAds(userAds);
        } catch (e) {
          console.error("Failed to fetch ads:", e);
          if (isActive) setAds([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchAds();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Confirm and delete ad
  const confirmDelete = (adId) => {
    Alert.alert(
      "Delete Ad",
      "Are you sure you want to delete this ad?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(adId),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = async (adId) => {
    try {
      await deleteDoc(doc(db, "items", adId));
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      Alert.alert("Error", "Failed to delete the ad. Please try again.");
    }
  };

  // Render right actions (Delete button) for swipeable
  const renderRightActions = (progress, dragX, item) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => confirmDelete(item.id)}
    >
      <Icon name="delete" size={24} color="#fff" />
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AdDetails", { ad: item })}
        activeOpacity={0.85}
      >
        {item.imageUrls && item.imageUrls.length > 0 ? (
          <Image
            source={{ uri: item.imageUrls[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || "No title"}
          </Text>
          <Text style={styles.price}>
            {item.price ? `$${item.price}` : "No price"}
          </Text>
          <Text style={styles.location}>{item.pickupLocation || ""}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const styles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? "light-content" : "dark-content";
  const statusBarBg = isDarkMode ? "#121212" : "#fff";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon
            name="arrow-left"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Ads</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2CB67D" />
        </View>
      ) : ads.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You have not posted any ads yet.</Text>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const baseStyles = {
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: 90,
    backgroundColor: "#eee",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  imagePlaceholderText: {
    color: "#666",
    fontSize: 12,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
  },
  location: {
    fontSize: 13,
    color: "#555",
  },
  emptyText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#FF4D4F",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "90%",
    borderRadius: 12,
    marginVertical: 8,
    marginRight: 8,
    flexDirection: "column",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 2,
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  safe: { ...baseStyles.safe, backgroundColor: "#fff" },
  header: { ...baseStyles.header, borderBottomColor: "#eee" },
  headerTitle: { ...baseStyles.headerTitle, color: "#000" },
  card: { ...baseStyles.card, backgroundColor: "#fff" },
  title: { ...baseStyles.title, color: "#23253A" },
  price: { ...baseStyles.price, color: "#2CB67D" },
  emptyText: { ...baseStyles.emptyText, color: "#444" },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  safe: { ...baseStyles.safe, backgroundColor: "#121212" },
  header: { ...baseStyles.header, borderBottomColor: "#333" },
  headerTitle: { ...baseStyles.headerTitle, color: "#fff" },
  card: { ...baseStyles.card, backgroundColor: "#1E1E1E" },
  title: { ...baseStyles.title, color: "#fff" },
  price: { ...baseStyles.price, color: "#4CAF50" },
  emptyText: { ...baseStyles.emptyText, color: "#ccc" },
});
