// Components/screens/MarketplaceScreen.js
import React, { useContext } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext"; 

const { width } = Dimensions.get("window");


const categories = [
  { label: "Jobs", icon: "briefcase-outline", color: "#FFE2E2" },
  { label: "Electronics", icon: "laptop", color: "#FFF6D4" },
  { label: "Vehicles", icon: "car-outline", color: "#E2F6FF" },
  { label: "Docs", icon: "file-document-outline", color: "#E9E2FF" },
  { label: "Books", icon: "book-open-page-variant", color: "#E2FFE9" },
];

const latestAds = [
  {
    id: "1",
    image: require("../../assets/Images/headphones.jpg"),
    title: "Product title....",
    category: "CATEGORY",
    location: "LOCATION",
    price: "00.000 CAD",
  },
  {
    id: "2",
    image: require("../../assets/Images/car.jpg"),
    title: "Product title....",
    category: "CATEGORY",
    location: "LOCATION",
    price: "00.000 CAD",
  },
];

const otherAds = [
  {
    id: "3",
    image: require("../../assets/Images/nike-shoes.jpg"),
    title: "Product title....",
    price: "00.000 CAD",
  },
  {
    id: "4",
    image: require("../../assets/Images/bag.jpg"),
    title: "Product title....",
    price: "00.000 CAD",
  },
  {
    id: "5",
    image: require("../../assets/Images/tv.jpg"),
    title: "Product title....",
    price: "00.000 CAD",
  },
  {
    id: "6",
    image: require("../../assets/Images/shoes.jpg"),
    title: "Product title....",
    price: "00.000 CAD",
  },
];

/* ─────────────────────────────────────────────── */

export default function MarketplaceScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const st = isDarkMode ? dark : light; // pick style set

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
          <TouchableOpacity>
            <Text style={st.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.categoriesRow}
        >
          {categories.map((cat, i) => (
            <View key={i} style={st.categoryColumn}>
              <View style={[st.categoryCircle, { backgroundColor: cat.color }]}>
                <Icon name={cat.icon} size={24} color="#555" />
              </View>
              <Text style={st.categoryLabel}>{cat.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Latest Ads */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Latest Ads</Text>
          <TouchableOpacity>
            <Text style={st.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={latestAds}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          renderItem={({ item }) => (
            <View style={st.adCard}>
              <Image source={item.image} style={st.adImage} />
              <View style={st.adInfoRow}>
                <Text style={st.adCategory}>{item.category}</Text>
                <Text style={st.adLocation}>{item.location}</Text>
              </View>
              <Text style={st.adTitle}>{item.title}</Text>
              <Text style={st.adPrice}>{item.price}</Text>
              <View style={st.adActionsRow}>
                <Icon
                  name="share-variant"
                  size={20}
                  color={isDarkMode ? "#bbb" : "#A0A0A0"}
                />
                <Icon
                  name="bookmark-outline"
                  size={20}
                  color={isDarkMode ? "#bbb" : "#A0A0A0"}
                  style={{ marginLeft: 16 }}
                />
              </View>
            </View>
          )}
        />

        {/* Others */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Others</Text>
          <TouchableOpacity>
            <Text style={st.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={st.gridWrap}>
          {otherAds.map((item) => (
            <View key={item.id} style={st.gridCard}>
              <Image source={item.image} style={st.gridImage} />
              <Text style={st.gridTitle}>{item.title}</Text>
              <Text style={st.gridPrice}>{item.price}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
  categoriesRow: { flexDirection: "row", marginHorizontal: 4 },
  categoryColumn: { alignItems: "center", marginRight: 20 },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  adCard: {
    width: width * 0.5,
    borderRadius: 12,
    marginRight: 18,
    padding: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adImage: { width: "100%", height: 90, borderRadius: 10, marginBottom: 8 },
  adInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  adCategory: { fontSize: 12, fontWeight: "bold" },
  adLocation: { fontSize: 12, fontWeight: "bold" },
  adTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  adPrice: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  adActionsRow: { flexDirection: "row", marginTop: 4 },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  gridCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    marginBottom: 18,
    padding: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridImage: { width: "100%", height: 90, borderRadius: 10, marginBottom: 8 },
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
  categoryLabel: { fontSize: 14, color: "#333", fontWeight: "500" },
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
  categoryLabel: { fontSize: 14, color: "#ddd", fontWeight: "500" },
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
