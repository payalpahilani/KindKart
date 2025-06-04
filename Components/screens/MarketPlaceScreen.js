// MarketplaceScreen.js
import React from "react";
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

const { width } = Dimensions.get("window");

const categories = [
  { label: "Jobs", icon: "briefcase-outline", color: "#FFE2E2" },
  { label: "Electronics", icon: "laptop", color: "#FFF6D4" },
  { label: "Vehicles", icon: "car-outline", color: "#E2F6FF" },
  { label: "Text", icon: "file-document-outline", color: "#E9E2FF" },
  { label: "Text", icon: "file-document-outline", color: "#E2FFE9" },
];

const latestAds = [
  {
    id: "1",
    image: require("../../assets/Images/headphones.jpg"), // Replace with your image
    title: "Product title....",
    category: "CATEGORY",
    location: "LOCATION",
    price: "00.000 CAD",
  },
  {
    id: "2",
    image: require("../../assets/Images/car.jpg"), // Replace with your image
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

export default function MarketplaceScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>
          What are you{"\n"}looking for today?
        </Text>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon name="magnify" size={20} color="#A0A0A0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="tune" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.categoryColumn}>
                <View
                  style={[
                    styles.categoryCircle,
                    { backgroundColor: cat.color },
                  ]}
                >
                  <Icon name={cat.icon} size={26} color="#555" />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Latest Ads */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Ads</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={latestAds}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
          renderItem={({ item }) => (
            <View style={styles.adCard}>
              <Image source={item.image} style={styles.adImage} />
              <View style={styles.adInfoRow}>
                <Text style={styles.adCategory}>{item.category}</Text>
                <Text style={styles.adLocation}>{item.location}</Text>
              </View>
              <Text style={styles.adTitle}>{item.title}</Text>
              <Text style={styles.adPrice}>{item.price}</Text>
              <View style={styles.adActionsRow}>
                <Icon name="share-variant" size={20} color="#A0A0A0" />
                <Icon
                  name="bookmark-outline"
                  size={20}
                  color="#A0A0A0"
                  style={{ marginLeft: 16 }}
                />
              </View>
            </View>
          )}
        />

        {/* Others Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Others</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridWrap}>
          {otherAds.map((item) => (
            <View key={item.id} style={styles.gridCard}>
              <Image source={item.image} style={styles.gridImage} />
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridPrice}>{item.price}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#23253A",
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 30,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF5EC",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#23253A",
  },
  filterButton: {
    marginLeft: 12,
    backgroundColor: "#23253A",
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#23253A" },
  seeAll: { color: "#2CB67D", fontWeight: "600", fontSize: 14 },
  categoriesRow: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  categoryColumn: {
    alignItems: "center",
    marginRight: 20,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    fontWeight: 500
  },
  adCard: {
    width: width * 0.5,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 18,
    marginBottom: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  adInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  adCategory: {
    fontSize: 12,
    color: "#FF7A7A",
    fontWeight: "bold",
  },
  adLocation: {
    fontSize: 12,
    color: "#2CB67D",
    fontWeight: "bold",
  },
  adTitle: {
    fontSize: 14,
    color: "#23253A",
    fontWeight: "600",
    marginBottom: 2,
  },
  adPrice: {
    fontSize: 15,
    color: "#23253A",
    fontWeight: "bold",
    marginBottom: 4,
  },
  adActionsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  gridCard: {
    width: (width - 48) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 18,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    color: "#23253A",
    fontWeight: "600",
    marginBottom: 2,
  },
  gridPrice: {
    fontSize: 15,
    color: "#23253A",
    fontWeight: "bold",
  },
});
