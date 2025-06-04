// HomeScreen.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const categories = [
  { label: "Donation", icon: "hand-heart" },
  { label: "Charity", icon: "charity" },
  { label: "Campaign", icon: "bullhorn" },
  { label: "Support", icon: "lifebuoy" },
];

const urgentDonations = [
  {
    id: "1",
    title: "Orphan Foundation",
    description: "Help children for orphanage scholarship...",
    image: require("../../assets/Images/orphanage.jpg"),
    raised: "$2,400",
    daysLeft: 22,
  },
  {
    id: "2",
    title: "Animal Kaiser",
    description: "Help and care for abandoned animals in S...",
    image: require("../../assets/Images/animals.jpg"),
    raised: "$2,400",
    daysLeft: 22,
  },
];

const DonateButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.donateButton}>
    <Text style={styles.donateButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Icon
            name="magnify"
            size={22}
            color="#888"
            style={{ marginLeft: 10 }}
          />
          <TextInput
            style={styles.searchBar}
            placeholder="What do you want to help?"
            placeholderTextColor="#888"
          />
        </View>
        {/* Banner / Carousel */}
        <View style={styles.banner}>
          <Image
            source={require("../../assets/Images/school.jpg")}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>
              Support campaign cost for children's school
            </Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>View more</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sharing kindness</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <View key={cat.label} style={styles.categoryItem}>
              <View style={styles.categoryIconWrap}>
                <Icon name={cat.icon} size={28} color="#4A90E2" />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </View>
          ))}
        </View>
        {/* Urgent Donations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Urgent donation</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={urgentDonations}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.donationCard}>
              <Image source={item.image} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardInfoBox}>
                    <Text style={styles.cardInfoLabel}>Raised</Text>
                    <Text style={styles.cardInfoValue}>{item.raised}</Text>
                  </View>
                  <View style={styles.cardInfoBox}>
                    <Text style={styles.cardInfoLabel}>Days left</Text>
                    <Text style={styles.cardInfoValue}>{item.daysLeft}</Text>
                  </View>
                </View>
                <DonateButton title="Donate" onPress={() => {}} />
              </View>
            </View>
          )}
        />
        <View style={{ height: 32 }} /> {/* Spacer for bottom tab bar */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, backgroundColor: "#fff" },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    paddingHorizontal: 6,
    marginBottom: 20,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    backgroundColor: "transparent",
    marginLeft: 8,
    color: "#222",
  },
  banner: { position: "relative", marginBottom: 10 },
  bannerImage: { width: "100%", height: 190, borderRadius: 18 },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
  },
  bannerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: "#F6B93B",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
  },
  seeAll: {
    color: "#F6B93B",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 16,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryItem: { alignItems: "center", width: 80, marginHorizontal: 10 },
  categoryIconWrap: {
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
    fontWeight: "500",
  },
  donationCard: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 18,
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginVertical: 8,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardContent: { padding: 12 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 2 },
  cardDesc: { color: "#777", fontSize: 13, marginBottom: 8 },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardInfoBox: { alignItems: "center" },
  cardInfoLabel: { fontSize: 12, color: "#888" },
  cardInfoValue: { fontSize: 14, color: "#222", fontWeight: "bold" },
  donateButton: {
    backgroundColor: "#F6B93B",
    borderRadius: 22,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 2,
    shadowColor: "#F6B93B",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  donateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
