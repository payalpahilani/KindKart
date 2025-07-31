import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const allCategories = [
  { label: "Donation", icon: "hand-heart" },
  { label: "Charity", icon: "charity" },
  { label: "Campaign", icon: "bullhorn" },
  { label: "Support", icon: "lifebuoy" },
  { label: "Fundraiser", icon: "cash" },
  { label: "Awareness", icon: "lightbulb-on-outline" },
  { label: "Events", icon: "calendar" },
  { label: "Show all", icon: "view-dashboard" },
];

const DonateButton = ({ onPress, title, isDarkMode }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.donateButton, isDarkMode && styles.donateButtonDark]}
  >
    <Text
      style={[
        styles.donateButtonText,
        isDarkMode && styles.donateButtonTextDark,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [urgentDonations, setUrgentDonations] = useState([]);
  const [nonUrgentDonations, setNonUrgentDonations] = useState([]);
  const [showAllOthers, setShowAllOthers] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Show all");
  const [randomBanner, setRandomBanner] = useState(null);

  const filterCampaigns = (searchTerm, category) => {
    const filteredUrgent = [];
    const filteredNonUrgent = [];

    allCampaigns.forEach((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === "Show all" || item.category?.toLowerCase() === category.toLowerCase();

      if (matchesSearch && matchesCategory) {
        if (item.isUrgent) {
          filteredUrgent.push(item);
        } else {
          filteredNonUrgent.push(item);
        }
      }
    });

    setUrgentDonations(filteredUrgent);
    setNonUrgentDonations(filteredNonUrgent);
  };


  useFocusEffect(
    useCallback(() => {
      const fetchCampaigns = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "campaigns"));
          const campaigns = [];
  
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const campaign = {
              id: docSnap.id,
              title: data.title || "",
              description: data.story || "",
              imageUrl: data.imageUrls?.[0] || null,
              raised: `$${(data.raisedAmount || 0).toLocaleString()}`,
              raisedRaw: data.raisedAmount || 0,
              total: data.totalDonation || 0,
              daysLeft: calculateDaysLeft(data.campaignDate),
              fullStory: data.story || "",
              isUrgent: data.urgent === true,
              category: data.category || "Uncategorized",
            };
            campaigns.push(campaign);
          });
  
          setAllCampaigns(campaigns);
          setRandomBanner(campaigns[Math.floor(Math.random() * campaigns.length)]);
          filterCampaigns(searchQuery, "Show all");
        } catch (error) {
          console.error("Error fetching campaigns on refocus:", error);
        }
      };
  
      fetchCampaigns();
      setSelectedCategory("Show all");
      setSearchQuery("");
    }, [])
  );
  


  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "campaigns"));
        const campaigns = [];
  
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const campaign = {
            id: docSnap.id,
            title: data.title || "",
            description: data.story || "",
            imageUrl: data.imageUrls?.[0] || null,
            raised: `$${(data.raisedAmount || 0).toLocaleString()}`,
            daysLeft: calculateDaysLeft(data.campaignDate),
            fullStory: data.story || "",
            isUrgent: data.urgent === true,
            category: data.category || "Uncategorized",
          };
          campaigns.push(campaign);
        });
  
        setAllCampaigns(campaigns);
        setRandomBanner(campaigns[Math.floor(Math.random() * campaigns.length)]);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };
  
    fetchCampaigns();
  }, []);


  useEffect(() => {
    if (allCampaigns.length > 0) {
      setSelectedCategory("Show all"); // <-- optional, to reset
      filterCampaigns(searchQuery, "Show all");
    }
  }, [allCampaigns]);
  
  const calculateDaysLeft = (dateStr) => {
    try {
      const target = new Date(dateStr?.seconds ? dateStr.seconds * 1000 : dateStr);
      const now = new Date();
      const diff = target - now;
      return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const requestAndStoreLocation = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const permissionKey = `locationPermission_${user.uid}`;
        const storedPermission = await AsyncStorage.getItem(permissionKey);

        if (storedPermission === "granted" || storedPermission === "denied") return;

        Alert.alert(
          "Location Permission",
          "KindKart would like to access your location to show nearby donation opportunities. Do you want to allow access?",
          [
            {
              text: "Don't Allow",
              onPress: async () => {
                await AsyncStorage.setItem(permissionKey, "denied");
              },
              style: "cancel",
            },
            {
              text: "Allow",
              onPress: async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  const location = await Location.getCurrentPositionAsync({});
                  await AsyncStorage.setItem(permissionKey, "granted");
                  await setDoc(doc(db, "locations", user.uid), {
                    uid: user.uid,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date().toISOString(),
                  });
                } else {
                  await AsyncStorage.setItem(permissionKey, "denied");
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    };

    requestAndStoreLocation();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode ? styles.darkBg : styles.lightBg]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? "#2C2C2C" : "#F5F6FA" }]}>
          <Icon name="magnify" size={22} color={isDarkMode ? "#bbb" : "#888"} style={{ marginLeft: 10 }} />
          <TextInput
            style={[styles.searchBar, { color: isDarkMode ? "#eee" : "#222" }]}
            placeholder="What do you want to help?"
            placeholderTextColor={isDarkMode ? "#999" : "#888"}
            onChangeText={(text) => {
              setSearchQuery(text);
              filterCampaigns(text, selectedCategory);
            }}
            value={searchQuery}
          />
        </View>

        {/* Banner */}
        {randomBanner && (
          <View style={styles.banner}>
            <Image source={{ uri: randomBanner.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerText}>{randomBanner.title}</Text>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => navigation.navigate("DonationDetail", { campaignId: randomBanner.id })}
              >
                <Text style={styles.bannerButtonText}>View more</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Sharing Kindness</Text>
          <TouchableOpacity onPress={() => setShowAllCategories(!showAllCategories)}>
            <Text style={[styles.seeAll, isDarkMode && styles.seeAllDark]}>
              {showAllCategories ? "Show less" : "See all"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesRow}>
          {(showAllCategories ? allCategories : allCategories.slice(0, 4)).map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryItem, selectedCategory === cat.label && { opacity: 0.6 }]}
              onPress={() => {
                setSelectedCategory(cat.label);
                filterCampaigns(searchQuery, cat.label);
              }}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: isDarkMode ? "#444" : "#F5F6FA" }]}>
                <Icon name={cat.icon} size={28} color="#4A90E2" />
              </View>
              <Text style={[styles.categoryLabel, isDarkMode && styles.darkText]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urgent Campaigns */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Urgent donation</Text>
        </View>
        <FlatList
          data={urgentDonations}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.donationCard, { backgroundColor: isDarkMode ? "#222" : "#fff" }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#666" }}>No Image</Text>
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.cardDesc, isDarkMode && styles.cardDescDark]} numberOfLines={2}>{item.description}</Text>
                <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                  {item.daysLeft} days left · {item.raised} raised
                </Text>
                <DonateButton title="Donate" onPress={() => navigation.navigate("DonationDetail", { campaignId: item.id })} isDarkMode={isDarkMode} />
              </View>
            </View>
          )}
        />

        {/* Others */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Others</Text>
          {nonUrgentDonations.length > 2 && (
            <TouchableOpacity onPress={() => setShowAllOthers(!showAllOthers)}>
              <Text style={[styles.seeAll, isDarkMode && styles.seeAllDark]}>
                {showAllOthers ? "Show less" : "See all"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={showAllOthers ? nonUrgentDonations : nonUrgentDonations.slice(0, 2)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: "48%", marginBottom: 16 }}
              onPress={() => navigation.navigate("DonationDetail", { campaignId: item.id })}
            >
              <View style={[styles.donationCardGrid, { backgroundColor: isDarkMode ? "#222" : "#fff" }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ color: "#666" }}>No Image</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.cardDesc, isDarkMode && styles.cardDescDark]} numberOfLines={2}>{item.description}</Text>
                  <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                    {item.daysLeft} days left · {item.raised} raised
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  lightBg: { backgroundColor: "#fff" },
  darkBg: { backgroundColor: "#121212" },
  container: { padding: 16 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 16,
    color: "#222",
  },
  seeAll: {
    color: "#F6B93B",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 16,
  },
  seeAllDark: {
    color: "#F6B93B",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  categoryItem: {
    width: "25%",       // fixed width so they stack as expected
    marginBottom: 16,
    alignItems: "center",
  },
  
  
  categoryIconWrap: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    backgroundColor: "#F5F6FA",
  },
  categoryLabel: { fontWeight: "600", fontSize: 13, color: "#444" },
  darkText: { color: "#eee" },
  donationCard: {
    width: 230,
    borderRadius: 18,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImage: { width: "100%", height: 130, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardContent: { padding: 14 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4, color: "#222" , height: 22},
  cardDesc: { fontSize: 13, color: "#666", marginBottom: 12 },
  cardDescDark: { color: "#ccc" },
  cardInfoRow: { flexDirection: "row", justifyContent: "space-between" },
  cardInfoBox: { alignItems: "center" },
  cardInfoLabel: { fontSize: 12, color: "#999" },
  cardInfoLabelDark: { color: "#bbb" },
  cardInfoValue: { fontWeight: "600", fontSize: 14, color: "#222" },
  donateButton: {
    backgroundColor: "#F6B93B",
    paddingVertical: 12,
    marginTop: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  donateButtonDark: { backgroundColor: "#F6B93B" },
  donateButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  donateButtonTextDark: { color: "#fff" },
  donationCardGrid: {
    width: "100%",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  }
  
});
