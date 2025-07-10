import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Share,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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
  { label: "Jewellery", icon: "diamond-stone", color: "#FFE2E2" },
  { label: "Fashion & Apparel", icon: "tshirt-crew", color: "#E9E2FF" },
  { label: "Home & Kitchen", icon: "sofa", color: "#E2F6FF" },
  { label: "Beauty & Personal Care", icon: "face-woman", color: "#ECF5EC" },
  { label: "Sports & Outdoors", icon: "basketball", color: "#FFF6D4" },
  {
    label: "Books & Educational",
    icon: "book-open-page-variant",
    color: "#E2FFE9",
  },
  { label: "Pet Supplies", icon: "dog", color: "#FFE2E2" },
  { label: "Toys & Games", icon: "puzzle", color: "#E9E2FF" },
  { label: "Health & Wellness", icon: "heart", color: "#E2F6FF" },
];

const NUM_CAT_COLUMNS = 5;
const NUM_COLUMNS = 2;

const handleShare = async (ad) => {
  try {
    await Share.share({
      message: `Check out this ad!\n\n${ad.title}\nPrice: ${
        ad.currency || ""
      } ${ad.price}\nLocation: ${ad.pickupLocation}\n${ad.firstImage}`,
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
  const [searchQuery, setSearchQuery] = useState("");
  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState("date_desc");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // For applying filter (so user can cancel modal without applying)
  const [pendingSort, setPendingSort] = useState(sortOption);
  const [pendingCategories, setPendingCategories] =
    useState(selectedCategories);
  const [pendingMinPrice, setPendingMinPrice] = useState(minPrice);
  const [pendingMaxPrice, setPendingMaxPrice] = useState(maxPrice);

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

  // --- FILTERING & SORTING ---
  const filteredAds = ads.filter((ad) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(
          (typeof ad.title === "string" &&
            ad.title.toLowerCase().includes(q)) ||
          (typeof ad.category === "string" &&
            ad.category.toLowerCase().includes(q)) ||
          (typeof ad.categoryShort === "string" &&
            ad.categoryShort.toLowerCase().includes(q)) ||
          (typeof ad.pickupLocation === "string" &&
            ad.pickupLocation.toLowerCase().includes(q))
        )
      ) {
        return false;
      }
    }
    // Category filter
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(ad.category)) return false;
    }
    // Price range filter
    const price = parseFloat(ad.price);
    if (minPrice && (!price || price < parseFloat(minPrice))) return false;
    if (maxPrice && (!price || price > parseFloat(maxPrice))) return false;
    return true;
  });

  // --- SORTING ---
  let sortedAds = [...filteredAds];
  if (sortOption === "date_desc") {
    sortedAds.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  } else if (sortOption === "date_asc") {
    sortedAds.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    });
  } else if (sortOption === "price_asc") {
    sortedAds.sort(
      (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
    );
  } else if (sortOption === "price_desc") {
    sortedAds.sort(
      (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
    );
  }

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  const latestAds = sortedAds.filter((ad) => {
    if (!ad.createdAt) return false;
    const adTime =
      ad.createdAt.seconds * 1000 +
      Math.floor(ad.createdAt.nanoseconds / 1000000);
    return adTime >= twentyFourHoursAgo;
  });

  const otherAds = sortedAds.filter((ad) => {
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

  // Build the list data for FlatList
  const listData = [
    { type: "header" },
    { type: "categories" },

    { type: "sectionHeader", title: "Latest Ads", section: "latest" },
    ...(latestAds.length === 0
      ? [{ type: "empty", message: "No new ads in the last 24 hours." }]
      : (showAllLatest ? latestAds : latestAds.slice(0, 2)).map((ad) => ({
          ...ad,
          type: "ad",
          section: "latest",
        }))),

    { type: "sectionHeader", title: "Others", section: "others" },
    ...(otherAds.length === 0
      ? [{ type: "empty", message: "No other ads available." }]
      : (showAllOthers ? otherAds : otherAds.slice(0, 2)).map((ad) => ({
          ...ad,
          type: "ad",
          section: "others",
        }))),
  ];

  const renderItem = ({ item, index }) => {
    // Header
    if (item.type === "header") {
      return (
        <Text style={st.headerTitle}>What are you{"\n"}looking for today?</Text>
      );
    }
    // Categories
    if (item.type === "categories") {
      // Determine how many categories to show
      const catsToShow = showAllCategories
        ? categories
        : categories.slice(0, 5);

      // Split into rows of 5
      const rows = [];
      for (let i = 0; i < catsToShow.length; i += 5) {
        rows.push(catsToShow.slice(i, i + 5));
      }

      return (
        <>
          {/* SEARCH BAR + FILTER BUTTON */}
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
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Icon name="close" size={18} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={st.filterButton}
              onPress={() => {
                setPendingSort(sortOption);
                setPendingCategories(selectedCategories);
                setPendingMinPrice(minPrice);
                setPendingMaxPrice(maxPrice);
                setFilterModalVisible(true);
              }}
            >
              <Icon name="tune" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
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
          <View style={st.categoriesGrid}>
            {rows.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{ flexDirection: "row", marginBottom: 12 }}
              >
                {row.map((cat, idx) => (
                  <TouchableOpacity
                    key={cat.label}
                    style={st.categoryColumn}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("CategoryAdsScreen", {
                        category: cat.label,
                      })
                    }
                  >
                    <View
                      style={[
                        st.categoryCircle,
                        { backgroundColor: cat.color },
                      ]}
                    >
                      <Icon name={cat.icon} size={24} color="#555" />
                    </View>
                    <Text
                      style={st.categoryLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* Fill empty columns if last row has less than 5 */}
                {row.length < 5 &&
                  Array.from({ length: 5 - row.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={st.categoryColumn} />
                  ))}
              </View>
            ))}
          </View>
        </>
      );
    }
    // Section Header
    if (item.type === "sectionHeader") {
      let expanded, onPress;
      if (item.section === "latest") {
        expanded = showAllLatest;
        onPress = () => handleToggle(setShowAllLatest, showAllLatest);
      } else if (item.section === "others") {
        expanded = showAllOthers;
        onPress = () => handleToggle(setShowAllOthers, showAllOthers);
      }
      return (
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>{item.title}</Text>
          <TouchableOpacity onPress={onPress}>
            <Text style={st.seeAll}>{expanded ? "Show less" : "See all"}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Empty
    if (item.type === "empty") {
      return <Text style={st.emptyText}>{item.message}</Text>;
    }
    // Ad Card
    return (
      <View style={{ flex: 1 }}>
        <AdGridCard ad={item} st={st} navigation={navigation} />
      </View>
    );
  };

  // Group ad cards into rows for two-column grid
  const groupIntoRows = (data) => {
    const rows = [];
    let row = [];
    for (const item of data) {
      if (item.type === "ad") {
        row.push(item);
        if (row.length === NUM_COLUMNS) {
          rows.push(row);
          row = [];
        }
      } else {
        if (row.length > 0) {
          rows.push(row);
          row = [];
        }
        rows.push([item]);
      }
    }
    if (row.length > 0) rows.push(row);
    return rows;
  };

  const rows = groupIntoRows(listData);

  // --- FILTER MODAL ---
  const toggleCategory = (cat) => {
    setPendingCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const applyFilters = () => {
    setSortOption(pendingSort);
    setSelectedCategories(pendingCategories);
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setPendingSort("date_desc");
    setPendingCategories([]);
    setPendingMinPrice("");
    setPendingMaxPrice("");
    setFilterModalVisible(false);
  };

  if (loading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetFilters}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            resetFilters();
            Keyboard.dismiss();
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.38)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 22,
                  borderTopRightRadius: 22,
                  paddingTop: 24,
                  paddingHorizontal: 20,
                  paddingBottom: 12,
                  minHeight: 420,
                  maxHeight: "90%",
                  shadowColor: "#000",
                  shadowOpacity: 0.14,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <View style={{ alignItems: "center", marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: "#E0E0E0",
                      marginBottom: 2,
                    }}
                  />
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 20,
                      color: "#23253A",
                      marginBottom: 8,
                    }}
                  >
                    Sort & Filter
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* SORT SECTION */}
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 15,
                      color: "#23253A",
                      marginBottom: 7,
                      marginTop: 8,
                    }}
                  >
                    Sort By
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {[
                      { label: "Newest First", value: "date_desc" },
                      { label: "Oldest First", value: "date_asc" },
                      { label: "Price: Low to High", value: "price_asc" },
                      { label: "Price: High to Low", value: "price_desc" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setPendingSort(opt.value)}
                        style={{
                          backgroundColor:
                            pendingSort === opt.value ? "#2CB67D" : "#F7F7F7",
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          marginRight: 10,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor:
                            pendingSort === opt.value ? "#2CB67D" : "#E0E0E0",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              pendingSort === opt.value ? "#fff" : "#23253A",
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* CATEGORY SECTION */}
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 15,
                      color: "#23253A",
                      marginBottom: 7,
                    }}
                  >
                    Categories
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.label}
                        onPress={() => toggleCategory(cat.label)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: pendingCategories.includes(cat.label)
                            ? "#E6FCF2"
                            : "#F7F7F7",
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          marginRight: 10,
                          marginBottom: 8,
                          borderWidth: 1.5,
                          borderColor: pendingCategories.includes(cat.label)
                            ? "#2CB67D"
                            : "#E0E0E0",
                        }}
                      >
                        <Icon
                          name={cat.icon}
                          size={16}
                          color={
                            pendingCategories.includes(cat.label)
                              ? "#2CB67D"
                              : "#888"
                          }
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: pendingCategories.includes(cat.label)
                              ? "#2CB67D"
                              : "#23253A",
                            fontWeight: "500",
                            fontSize: 13,
                          }}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* PRICE RANGE SECTION */}
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 15,
                      color: "#23253A",
                      marginBottom: 7,
                    }}
                  >
                    Price Range
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 10,
                        padding: 8,
                        width: 90,
                        marginRight: 10,
                        backgroundColor: "#F7F7F7",
                        fontSize: 15,
                        color: "#23253A",
                      }}
                      placeholder="Min"
                      keyboardType="numeric"
                      value={pendingMinPrice}
                      onChangeText={setPendingMinPrice}
                      placeholderTextColor="#A0A0A0"
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#888",
                        marginHorizontal: 4,
                      }}
                    >
                      to
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 10,
                        padding: 8,
                        width: 90,
                        backgroundColor: "#F7F7F7",
                        fontSize: 15,
                        color: "#23253A",
                      }}
                      placeholder="Max"
                      keyboardType="numeric"
                      value={pendingMaxPrice}
                      onChangeText={setPendingMaxPrice}
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  {/* BUTTONS */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 18,
                      marginBottom: 10,
                    }}
                  >
                    <TouchableOpacity onPress={resetFilters}>
                      <Text
                        style={{
                          color: "#FF7A7A",
                          fontWeight: "bold",
                          fontSize: 16,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                        }}
                      >
                        Reset
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={applyFilters}
                      style={{
                        backgroundColor: "#2CB67D",
                        borderRadius: 8,
                        paddingHorizontal: 32,
                        paddingVertical: 12,
                        shadowColor: "#2CB67D",
                        shadowOpacity: 0.14,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        Apply
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MAIN LIST */}
      <FlatList
        data={rows}
        keyExtractor={(_, idx) => "row-" + idx}
        renderItem={({ item: row }) => {
          // If this is a row of ad cards
          if (row[0] && row[0].type === "ad") {
            return (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                {row.map((item, idx) => (
                  <View
                    key={item.id}
                    style={{
                      flex: 1,
                      marginRight: idx === 0 && row.length === 2 ? 8 : 0,
                    }}
                  >
                    <AdGridCard ad={item} st={st} navigation={navigation} />
                  </View>
                ))}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            );
          }
          // Otherwise, render the single item (header, sectionHeader, empty)
          return renderItem({ item: row[0] });
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

// --- AdGridCard: grid card for both sections ---
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
        {/* Price with currency in green */}
        <Text style={[st.gridPrice, { color: "#2CB67D", marginBottom: 2 }]}>
          {ad.price ? `${ad.currency || ""} ${ad.price}` : ""}
        </Text>
        {/* Location in red, below price */}
        {ad.pickupLocation ? (
          <Text style={{ color: "#FF4D4F", fontSize: 13, marginBottom: 4 }}>
            {ad.pickupLocation}
          </Text>
        ) : null}
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

const common = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  headerTitle:{
    fontSize: 26,
    fontWeight: "bold",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#ECF5EC",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#23253A",
  },
  filterButton: {
    marginLeft: 12,
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#23253A",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#23253A",
  },
  seeAll: {
    color: "#2CB67D",
    fontWeight: "600",
    fontSize: 14,
  },
  categoriesGrid: {
    marginBottom: 16,
    marginHorizontal: 0,
  },
  categoryColumn: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    maxWidth: (width - 32) / NUM_CAT_COLUMNS,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
    marginHorizontal: 2,
    flexShrink: 1,
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
  gridImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  gridTitle: {
    fontSize: 14,
    color: "#23253A",
    fontWeight: "600",
    marginBottom: 2,
  },
  gridPrice: {
    fontSize: 15,
    color: "#2CB67D",
    fontWeight: "bold",
    marginBottom: 2,
  },
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
  searchInputWrap: { ...common.searchInputWrap, backgroundColor: "#ECF5EC" },
  searchInput: { ...common.searchInput, color: "#23253A" },
  filterButton: { ...common.filterButton, backgroundColor: "#23253A" },
  sectionTitle: { ...common.sectionTitle, color: "#23253A" },
  seeAll: { ...common.seeAll },
  categoryLabel: { ...common.categoryLabel, color: "#333" },
  gridCard: {
    ...common.gridCard,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  gridTitle: {
    ...common.gridTitle,
    color: "#23253A",
  },
  gridPrice: {
    ...common.gridPrice,
    color: "#2CB67D",
  },
});

const dark = StyleSheet.create({
  ...common,
  safe: { ...common.safe, backgroundColor: "#121212" },
  searchInputWrap: { ...common.searchInputWrap, backgroundColor: "#1E1E1E" },
  searchInput: { ...common.searchInput, color: "#eee" },
  filterButton: { ...common.filterButton, backgroundColor: "#2CB67D" },
  sectionTitle: { ...common.sectionTitle, color: "#eee" },
  seeAll: { ...common.seeAll },
  categoryLabel: { ...common.categoryLabel, color: "#ddd" },
  gridCard: {
    ...common.gridCard,
    backgroundColor: "#1E1E1E",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  gridTitle: {
    ...common.gridTitle,
    color: "#eee",
  },
  gridPrice: {
    ...common.gridPrice,
    color: "#2CB67D",
  },
});

