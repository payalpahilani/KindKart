import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const { width } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const categories = [
  { label: "Electronics", icon: "laptop", color: "#FFF6D4" },
  { label: "Jewelry", icon: "diamond-stone", color: "#FFE2E2" },
  { label: "Fashion", icon: "tshirt-crew", color: "#E9E2FF" },
  { label: "Home", icon: "sofa", color: "#E2F6FF" },
  { label: "Beauty", icon: "face-woman", color: "#ECF5EC" },
  { label: "Sports", icon: "basketball", color: "#FFF6D4" },
  { label: "Books", icon: "book-open-page-variant", color: "#E2FFE9" },
  { label: "Pets", icon: "dog", color: "#FFE2E2" },
  { label: "Toys", icon: "puzzle", color: "#E9E2FF" },
  { label: "Health", icon: "heart", color: "#E2F6FF" },
];

const NUM_COLUMNS = 5;

// --- SHARE FUNCTIONALITY ---
const handleShare = async (ad) => {
  try {
    await Share.share({
      message: `Check out this ad!\n\n${ad.title}\nPrice: ${ad.currency}-${ad.price}\nLocation: ${ad.pickupLocation}\n${ad.firstImage}`,
      url: ad.firstImage,
      title: ad.title,
    });
  } catch (error) {
    alert("Error sharing: " + error.message);
  }
};

export default function MarketplaceScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const st = isDarkMode ? dark : light;

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);
  const [showAllOthers, setShowAllOthers] = useState(false);

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time fetch from 'items' collection and transform data!
  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedItems = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const firstImage =
            Array.isArray(data.imageUrls) && data.imageUrls.length > 0
              ? data.imageUrls[0]
              : "https://via.placeholder.com/150";
          const categoryShort =
            typeof data.category === "string"
              ? data.category.split(" ")[0]
              : "";
          return {
            id: doc.id,
            ...data,
            firstImage,
            categoryShort,
          };
        });
        setAds(fetchedItems);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  const latestAds = ads.filter((ad) => {
    if (!ad.createdAt) return false;
    const adTime =
      ad.createdAt.seconds * 1000 +
      Math.floor(ad.createdAt.nanoseconds / 1000000);
    return adTime >= twentyFourHoursAgo;
  });

  const otherAds = ads.filter((ad) => {
    if (!ad.createdAt) return true;
    const adTime =
      ad.createdAt.seconds * 1000 +
      Math.floor(ad.createdAt.nanoseconds / 1000000);
    return adTime < twentyFourHoursAgo;
  });

  const handleToggle = (setter, value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(!value);
  };

  const renderCategory = ({ item }) => (
    <View style={st.categoryColumn}>
      <View style={[st.categoryCircle, { backgroundColor: item.color }]}>
        <Icon name={item.icon} size={24} color="#555" />
      </View>
      <Text style={st.categoryLabel}>{item.label}</Text>
    </View>
  );

  const renderCategoriesGrid = () => (
    <View style={st.categoriesGrid}>
      {categories.map((cat) => (
        <View key={cat.label} style={st.categoryColumn}>
          <View style={[st.categoryCircle, { backgroundColor: cat.color }]}>
            <Icon name={cat.icon} size={24} color="#555" />
          </View>
          <Text style={st.categoryLabel}>{cat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderAdsGrid = (data) => (
    <View style={st.gridWrap}>
      {data.map((item) => (
        <AdGridCard key={item.id} ad={item} st={st} navigation={navigation} />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={st.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={st.headerTitle}>What are you{"\n"}looking for today?</Text>

        {/* Search Bar */}
        <View style={st.searchRow}>
          <View style={[st.searchInputWrap]}>
            <Icon
              name="magnify"
              size={20}
              color={isDarkMode ? "#bbb" : "#A0A0A0"}
            />
            <TextInput
              style={st.searchInput}
              placeholder="Search products"
              placeholderTextColor={isDarkMode ? "#888" : "#A0A0A0"}
            />
          </View>
          <TouchableOpacity style={st.filterButton}>
            <Icon name="tune" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Categories</Text>
          <TouchableOpacity
            onPress={() =>
              handleToggle(setShowAllCategories, showAllCategories)
            }
          >
            <Text style={st.seeAll}>
              {showAllCategories ? "Show less" : "See all"}
            </Text>
          </TouchableOpacity>
        </View>
        {showAllCategories ? (
          renderCategoriesGrid()
        ) : (
          <FlatList
            data={categories.slice(0, 5)}
            horizontal
            keyExtractor={(item) => item.label}
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.categoriesRow}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          />
        )}

        {/* Latest Ads */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Latest Ads</Text>
          <TouchableOpacity
            onPress={() => handleToggle(setShowAllLatest, showAllLatest)}
          >
            <Text style={st.seeAll}>
              {showAllLatest ? "Show less" : "See all"}
            </Text>
          </TouchableOpacity>
        </View>
        {latestAds.length === 0 ? (
          <Text style={st.emptyText}>No new ads in the last 24 hours.</Text>
        ) : showAllLatest ? (
          renderAdsGrid(latestAds)
        ) : (
          <FlatList
            data={latestAds.slice(0, 5)}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item }) => (
              <AdCard ad={item} st={st} navigation={navigation} />
            )}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          />
        )}

        {/* Others */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Others</Text>
          <TouchableOpacity
            onPress={() => handleToggle(setShowAllOthers, showAllOthers)}
          >
            <Text style={st.seeAll}>
              {showAllOthers ? "Show less" : "See all"}
            </Text>
          </TouchableOpacity>
        </View>
        {otherAds.length === 0 ? (
          <Text style={st.emptyText}>No other ads available.</Text>
        ) : showAllOthers ? (
          renderAdsGrid(otherAds)
        ) : (
          <View style={st.gridWrap}>
            {otherAds.slice(0, 4).map((item) => (
              <AdGridCard
                key={item.id}
                ad={item}
                st={st}
                navigation={navigation}
              />
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- UPDATED AdCard: now navigates to AdDetails ---
function AdCard({ ad, st, navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("AdDetails", { ad })}
    >
      <View style={st.adCard}>
        <Image source={{ uri: ad.firstImage }} style={st.adImage} />
        <Text style={[st.adCategory, { color: "#FF0000", marginTop: 4 }]}>
          {ad.categoryShort}
        </Text>
        <Text style={[st.adLocation, { color: "#2CB67D", marginBottom: 2 }]}>
          {ad.pickupLocation}
        </Text>
        <Text style={st.adTitle}>{ad.title}</Text>
        <Text style={st.adPrice}>{ad.price ? `${ad.price}` : ""}</Text>
        <View style={st.adActionsRow}>
          <TouchableOpacity onPress={() => handleShare(ad)}>
            <Icon name="share-variant" size={20} color="#A0A0A0" />
          </TouchableOpacity>
          <Icon
            name="bookmark-outline"
            size={20}
            color="#A0A0A0"
            style={{ marginLeft: 16 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --- UPDATED AdGridCard: now navigates to AdDetails ---
function AdGridCard({ ad, st, navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("AdDetails", { ad })}
      style={{ flex: 1 }}
    >
      <View style={st.gridCard}>
        <Image source={{ uri: ad.firstImage }} style={st.gridImage} />
        <Text style={st.gridTitle}>{ad.title}</Text>
        <Text style={st.gridPrice}>{ad.price ? `${ad.price}` : ""}</Text>
        <TouchableOpacity
          onPress={() => handleShare(ad)}
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          <Icon name="share-variant" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────── */
/*                     STYLES                     */
/* ─────────────────────────────────────────────── */

const common = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filterButton: {
    marginLeft: 12,
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  categoriesRow: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    width: (width - 32 - 16 * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  adCard: {
    width: width * 0.5,
    borderRadius: 12,
    padding: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: "#fff",
  },
  adImage: { width: "100%", height: 90, borderRadius: 10, marginBottom: 8 },
  adInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  adCategory: { fontSize: 14, fontWeight: "bold" },
  adLocation: { fontSize: 14, fontWeight: "bold" },
  adTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  adPrice: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  adActionsRow: { flexDirection: "row", marginTop: 4 },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 16,
  },
  gridCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    marginBottom: 18,
    padding: 8,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: "#fff",
  },
  gridImage: { width: "100%", height: 90, borderRadius: 10, marginBottom: 8 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
    marginVertical: 10,
    textAlign: "center",
  },
});

const light = StyleSheet.create({
  ...common,
  safe: { ...common.safe, backgroundColor: "#fff" },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#23253A",
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 30,
  },
  searchInputWrap: { ...common.searchInputWrap, backgroundColor: "#ECF5EC" },
  searchInput: { ...common.searchInput, color: "#23253A" },
  filterButton: { ...common.filterButton, backgroundColor: "#23253A" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#23253A" },
  seeAll: { color: "#2CB67D", fontWeight: "600", fontSize: 14 },
  categoryLabel: { fontSize: 13, color: "#333", fontWeight: "500" },
  adCard: {
    ...common.adCard,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  adCategory: { ...common.adCategory, color: "#FF7A7A" },
  adLocation: { ...common.adLocation, color: "#2CB67D" },
  adTitle: { ...common.adTitle, color: "#23253A" },
  adPrice: { ...common.adPrice, color: "#23253A" },
  gridCard: {
    ...common.gridCard,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  gridTitle: {
    fontSize: 14,
    color: "#23253A",
    fontWeight: "600",
    marginBottom: 2,
  },
  gridPrice: { fontSize: 15, color: "#23253A", fontWeight: "bold" },
});

const dark = StyleSheet.create({
  ...common,
  safe: { ...common.safe, backgroundColor: "#121212" },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#eee",
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 30,
  },
  searchInputWrap: { ...common.searchInputWrap, backgroundColor: "#1E1E1E" },
  searchInput: { ...common.searchInput, color: "#eee" },
  filterButton: { ...common.filterButton, backgroundColor: "#2CB67D" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#eee" },
  seeAll: { color: "#2CB67D", fontWeight: "600", fontSize: 14 },
  categoryLabel: { fontSize: 13, color: "#ddd", fontWeight: "500" },
  adCard: {
    ...common.adCard,
    backgroundColor: "#1E1E1E",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  adCategory: { ...common.adCategory, color: "#FF7A7A" },
  adLocation: { ...common.adLocation, color: "#2CB67D" },
  adTitle: { ...common.adTitle, color: "#eee" },
  adPrice: { ...common.adPrice, color: "#eee" },
  gridCard: {
    ...common.gridCard,
    backgroundColor: "#1E1E1E",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  gridTitle: {
    fontSize: 14,
    color: "#eee",
    fontWeight: "600",
    marginBottom: 2,
  },
  gridPrice: { fontSize: 15, color: "#eee", fontWeight: "bold" },
});
