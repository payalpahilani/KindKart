import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db, auth } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";

export default function LikedAdsScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);

  const [likedAds, setLikedAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedAds = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLikedAds([]);
        setLoading(false);
        return;
      }
      const likedCol = collection(db, "users", currentUser.uid, "liked");
      const snapshot = await getDocs(likedCol);
      const ads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLikedAds(ads);
    } catch (error) {
      console.error("Error fetching liked ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedAds();
  }, []);

  const styles = isDarkMode ? darkStyles : lightStyles;
  const statusBarStyle = isDarkMode ? "light-content" : "dark-content";
  const statusBarBg = isDarkMode ? "#121212" : "#fff";

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("AdDetailsScreen", {
          ad: {
            id: item.adId,
            title: item.title,
            imageUrls: item.imageUrls,
            price: item.price,
          },
        })
      }
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
          {item.price ? `${item.price}` : "No price"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Liked Ads</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2CB67D" />
        </View>
      ) : likedAds.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No liked ads found.</Text>
        </View>
      ) : (
        <FlatList
          data={likedAds}
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
  emptyText: {
    fontSize: 16,
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
